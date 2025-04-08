import axios, { AxiosInstance } from 'axios';
import { LRUCache } from 'lru-cache';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class AlphaVantageService {
  private baseURL: string;
  private apiKey: string;
  private axiosInstance: AxiosInstance;
  private cache: LRUCache<string, MarketAsset[] | AssetData | HistoricalDataPoint[]>;
  private useMockData: boolean;

  constructor(apiKey?: string, useMockData: boolean = false) {
    console.log('[AlphaVantageService] Initializing service');
    this.baseURL = 'https://www.alphavantage.co/query';
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';
    this.useMockData = useMockData || !this.apiKey;

    if (this.useMockData) {
      if (!this.apiKey) {
        console.warn('Alpha Vantage API key not provided. Using mock data.');
      } else {
        console.warn('Mock data explicitly requested. Using mock data.');
      }
    } else {
      console.log('Using Alpha Vantage API with provided key:', this.apiKey.substring(0, 4) + '...');
    }

    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Initialize LRU cache with max 500 entries, each expiring after 5 minutes
    this.cache = new LRUCache<string, MarketAsset[] | AssetData | HistoricalDataPoint[]>({
      max: 500,
      ttl: 1000 * 60 * 5 // 5 minutes
    });

    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add a small delay to avoid rate limiting
        return new Promise((resolve) => {
          setTimeout(() => resolve(config), 200);
        });
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Generate a cache key based on method name and parameters
   */
  private generateCacheKey(method: string, ...args: any[]): string {
    return `${method}:${args.join(':')}`;
  }

  /**
   * Fetch with retry logic for handling transient errors
   */
  private async fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;

      // If rate limited, wait longer
      const waitTime = axios.isAxiosError(error) && error.response?.status === 429
        ? delay * 2
        : delay;

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.fetchWithRetry(fn, retries - 1, waitTime * 2);
    }
  }

  /**
   * Handle API errors with proper logging
   */
  private handleAPIError(error: unknown, context: string): void {
    // Log the error for debugging
    console.error(`${context}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`API Error - ${context}: ${errorMessage}`);
  }

  /**
   * List available stocks
   */
  async listAvailableStocks(options: {
    keywords?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<MarketAsset[]> {
    console.log('[AlphaVantageService] listAvailableStocks called with options:', options);
    const { keywords = '', page = 1, pageSize = 20 } = options;

    // If mock data is explicitly requested, return it immediately
    if (this.useMockData) {
      console.log('Using mock stock list data as configured');
      return this.getMockStocks(page, pageSize);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey('listAvailableStocks', JSON.stringify(options));
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log('Using cached stock list data');
      return cachedResult as MarketAsset[];
    }

    try {
      // Try to fetch real data from Alpha Vantage API
      console.log('Fetching stock list from Alpha Vantage API...');
      const response = await this.fetchWithRetry(async () => {
        const result = await this.axiosInstance.get(this.baseURL, {
          params: {
            function: 'SYMBOL_SEARCH',
            keywords: keywords || 'technology',
            apikey: this.apiKey
          }
        });
        return result.data;
      });

      if (!response.bestMatches || !Array.isArray(response.bestMatches)) {
        throw new Error('Invalid response format from Alpha Vantage API');
      }

      // Process and transform the API response
      const assets = response.bestMatches.map((match: Record<string, string>) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: this.determineAssetType(match['3. type']),
        description: `${match['2. name']} (${match['4. region']})`
      }));

      // Paginate the results
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedAssets = assets.slice(start, end);

      // Cache the result
      this.cache.set(cacheKey, paginatedAssets);
      console.log(`Successfully fetched ${paginatedAssets.length} stocks from Alpha Vantage API`);
      return paginatedAssets;
    } catch (error) {
      // Log the error but don't throw
      this.handleAPIError(error, 'Error fetching available stocks');

      // Fallback to mock data
      console.log('Falling back to mock stock list data');
      return this.getMockStocks(page, pageSize);
    }
  }

  /**
   * Get asset price and convert to BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData> {
    console.log(`[AlphaVantageService] getAssetPriceInBTC called for symbol: ${assetSymbol}`);

    // If mock data is explicitly requested, return it immediately
    if (this.useMockData) {
      console.log(`Using mock data for asset: ${assetSymbol}`);
      return this.getMockAssetData(assetSymbol);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey('getAssetPriceInBTC', assetSymbol);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log(`Using cached data for asset: ${assetSymbol}`);
      return cachedResult as AssetData;
    }

    try {
      console.log(`Fetching real-time data for asset: ${assetSymbol}`);

      // Fetch global quote for the asset
      console.log(`Requesting quote data for: ${assetSymbol}`);
      const quoteResponse = await this.fetchWithRetry(async () => {
        const result = await this.axiosInstance.get(this.baseURL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: assetSymbol,
            apikey: this.apiKey
          }
        });
        return result.data;
      });

      if (!quoteResponse['Global Quote'] || !quoteResponse['Global Quote']['05. price']) {
        throw new Error('Invalid quote response format from Alpha Vantage API');
      }

      const assetPriceUSD = parseFloat(quoteResponse['Global Quote']['05. price']);

      // Fetch current Bitcoin price from CoinGecko (free API)
      console.log('Requesting current Bitcoin price from CoinGecko');
      const btcResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const btcPriceUSD = btcResponse.data.bitcoin.usd;

      console.log(`Asset price: $${assetPriceUSD}, BTC price: $${btcPriceUSD}`);

      // Fetch asset overview for additional information
      console.log(`Requesting overview data for: ${assetSymbol}`);
      const overviewResponse = await this.fetchWithRetry(async () => {
        const result = await this.axiosInstance.get(this.baseURL, {
          params: {
            function: 'OVERVIEW',
            symbol: assetSymbol,
            apikey: this.apiKey
          }
        });
        return result.data;
      });

      // Fetch historical returns data
      console.log('Fetching historical returns data');
      const returns = await this.fetchReturns(assetSymbol);

      const assetData: AssetData = {
        name: overviewResponse.Name || assetSymbol,
        symbol: assetSymbol,
        type: this.determineAssetType(overviewResponse.AssetType || 'Equity'),
        priceInBTC: assetPriceUSD / btcPriceUSD,
        priceInUSD: assetPriceUSD,
        returns: returns,
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, assetData);
      console.log(`Successfully fetched and processed data for: ${assetSymbol}`);
      return assetData;
    } catch (error) {
      // Log the error but don't throw
      this.handleAPIError(error, `Error fetching data for asset: ${assetSymbol}`);

      // Fallback to mock data
      console.log(`Falling back to mock data for asset: ${assetSymbol}`);
      return this.getMockAssetData(assetSymbol);
    }
  }

  /**
   * Get historical price data for a stock
   */
  async getHistoricalData(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<HistoricalDataPoint[]> {
    console.log(`[AlphaVantageService] getHistoricalData called for symbol: ${symbol}`);

    if (this.useMockData) {
      console.log(`Using mock historical data for: ${symbol}`);
      return this.getMockHistoricalData(symbol);
    }

    const cacheKey = this.generateCacheKey('getHistoricalData', symbol, outputSize);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log(`Using cached historical data for: ${symbol}`);
      return cachedResult as HistoricalDataPoint[];
    }

    try {
      console.log(`Fetching historical data for: ${symbol}`);

      const response = await this.fetchWithRetry(async () => {
        const result = await this.axiosInstance.get(this.baseURL, {
          params: {
            function: 'TIME_SERIES_DAILY',
            symbol: symbol,
            outputsize: outputSize,
            apikey: this.apiKey
          }
        });
        return result.data;
      });

      if (!response['Time Series (Daily)']) {
        throw new Error('Invalid historical data response from Alpha Vantage API');
      }

      // Transform the response to our HistoricalDataPoint format
      const timeSeriesData = response['Time Series (Daily)'];
      const historicalData: HistoricalDataPoint[] = Object.entries(timeSeriesData)
        .map(([date, values]: [string, any]) => ({
          date,
          price: parseFloat(values['4. close']),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          volume: parseFloat(values['5. volume'])
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Cache the result
      this.cache.set(cacheKey, historicalData);
      console.log(`Successfully fetched historical data for: ${symbol}`);

      return historicalData;
    } catch (error) {
      this.handleAPIError(error, `Error fetching historical data for: ${symbol}`);
      return this.getMockHistoricalData(symbol);
    }
  }

  /**
   * Calculate returns for different time periods
   */
  private async fetchReturns(symbol: string): Promise<AssetData['returns']> {
    if (this.useMockData) {
      console.log(`Using mock returns data for: ${symbol}`);
      return this.getMockAssetData(symbol).returns;
    }

    try {
      console.log(`Fetching historical data for returns calculation: ${symbol}`);

      const historicalData = await this.getHistoricalData(symbol, 'full');
      if (!historicalData.length) {
        throw new Error('No historical data available');
      }

      const currentPrice = historicalData[historicalData.length - 1].price;

      // Calculate returns for different periods
      const now = new Date();
      const ytdDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const threeYearsAgo = new Date(now);
      threeYearsAgo.setFullYear(now.getFullYear() - 3);
      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setFullYear(now.getFullYear() - 5);

      // Find closest price points
      const ytdPrice = this.findClosestPrice(historicalData, ytdDate);
      const oneYearPrice = this.findClosestPrice(historicalData, oneYearAgo);
      const threeYearPrice = this.findClosestPrice(historicalData, threeYearsAgo);
      const fiveYearPrice = this.findClosestPrice(historicalData, fiveYearsAgo);
      const maxPrice = historicalData[0].price; // Oldest price in the dataset

      // Calculate percentage returns
      const calculateReturn = (oldPrice: number) =>
        oldPrice > 0 ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;

      return {
        ytd: calculateReturn(ytdPrice),
        oneYear: calculateReturn(oneYearPrice),
        threeYear: calculateReturn(threeYearPrice),
        fiveYear: calculateReturn(fiveYearPrice),
        max: calculateReturn(maxPrice)
      };
    } catch (error) {
      this.handleAPIError(error, `Error calculating returns for: ${symbol}`);
      return this.getMockAssetData(symbol).returns;
    }
  }

  /**
   * Find the closest price point to a given date
   */
  private findClosestPrice(data: HistoricalDataPoint[], targetDate: Date): number {
    let closest = data[0];
    let minDiff = Math.abs(new Date(data[0].date).getTime() - targetDate.getTime());

    for (const point of data) {
      const diff = Math.abs(new Date(point.date).getTime() - targetDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest.price;
  }

  /**
   * Determine asset type based on Alpha Vantage asset type
   */
  private determineAssetType(type: string): AssetCategory {
    const typeMap: Record<string, AssetCategory> = {
      'Equity': 'Stocks',
      'ETF': 'Stocks',
      'Fund': 'Stocks',
      'Index': 'Indices',
      'Commodity': 'Commodities',
      'Currency': 'Cryptocurrency',
      'Crypto': 'Cryptocurrency'
    };

    return typeMap[type] || 'Unknown';
  }

  /**
   * Generate mock stock data
   */
  private getMockStocks(page: number, pageSize: number): MarketAsset[] {
    const allStocks: MarketAsset[] = [
      { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks', description: 'Technology company' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', description: 'Software company' },
      { symbol: 'GOOGL', name: 'Alphabet Inc', type: 'Stocks', description: 'Internet services' },
      { symbol: 'AMZN', name: 'Amazon.com Inc', type: 'Stocks', description: 'E-commerce company' },
      { symbol: 'TSLA', name: 'Tesla Inc', type: 'Stocks', description: 'Electric vehicle manufacturer' },
      { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stocks', description: 'Social media company' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', description: 'Semiconductor company' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co', type: 'Stocks', description: 'Banking company' },
      { symbol: 'V', name: 'Visa Inc', type: 'Stocks', description: 'Financial services' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', description: 'Healthcare company' },
      { symbol: 'WMT', name: 'Walmart Inc', type: 'Stocks', description: 'Retail company' },
      { symbol: 'PG', name: 'Procter & Gamble Co', type: 'Stocks', description: 'Consumer goods' },
      { symbol: 'MA', name: 'Mastercard Inc', type: 'Stocks', description: 'Financial services' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc', type: 'Stocks', description: 'Healthcare company' },
      { symbol: 'HD', name: 'Home Depot Inc', type: 'Stocks', description: 'Retail company' },
      { symbol: 'BAC', name: 'Bank of America Corp', type: 'Stocks', description: 'Banking company' },
      { symbol: 'PFE', name: 'Pfizer Inc', type: 'Stocks', description: 'Pharmaceutical company' },
      { symbol: 'CSCO', name: 'Cisco Systems Inc', type: 'Stocks', description: 'Networking company' },
      { symbol: 'VZ', name: 'Verizon Communications Inc', type: 'Stocks', description: 'Telecommunications' },
      { symbol: 'ADBE', name: 'Adobe Inc', type: 'Stocks', description: 'Software company' }
    ];

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return allStocks.slice(start, end);
  }

  /**
   * Generate mock asset data for a given symbol
   */
  private getMockAssetData(symbol: string): AssetData {
    const mockData: {[key: string]: AssetData} = {
      'AAPL': {
        name: 'Apple Inc',
        symbol: 'AAPL',
        type: 'Stocks',
        priceInBTC: 0.0058,
        priceInUSD: 169.75,
        returns: {
          ytd: 15.5,
          oneYear: 25.3,
          threeYear: 45.2,
          fiveYear: 80.1,
          max: 150.7
        },
        lastUpdated: new Date()
      },
      'MSFT': {
        name: 'Microsoft Corporation',
        symbol: 'MSFT',
        type: 'Stocks',
        priceInBTC: 0.0126,
        priceInUSD: 369.14,
        returns: {
          ytd: 22.1,
          oneYear: 38.5,
          threeYear: 65.8,
          fiveYear: 110.2,
          max: 210.5
        },
        lastUpdated: new Date()
      },
      'GOOGL': {
        name: 'Alphabet Inc',
        symbol: 'GOOGL',
        type: 'Stocks',
        priceInBTC: 0.0051,
        priceInUSD: 149.12,
        returns: {
          ytd: 18.2,
          oneYear: 32.7,
          threeYear: 55.9,
          fiveYear: 95.3,
          max: 180.2
        },
        lastUpdated: new Date()
      },
      'AMZN': {
        name: 'Amazon.com Inc',
        symbol: 'AMZN',
        type: 'Stocks',
        priceInBTC: 0.0058,
        priceInUSD: 169.75,
        returns: {
          ytd: 14.3,
          oneYear: 28.9,
          threeYear: 49.7,
          fiveYear: 85.4,
          max: 165.8
        },
        lastUpdated: new Date()
      },
      'TSLA': {
        name: 'Tesla Inc',
        symbol: 'TSLA',
        type: 'Stocks',
        priceInBTC: 0.0068,
        priceInUSD: 199.95,
        returns: {
          ytd: -15.2,
          oneYear: -5.8,
          threeYear: 120.3,
          fiveYear: 850.6,
          max: 1250.2
        },
        lastUpdated: new Date()
      }
    };

    // Default to Apple if the requested symbol is not in our mock data
    return mockData[symbol] || mockData['AAPL'];
  }

  /**
   * Generate mock historical data for a symbol
   */
  private getMockHistoricalData(symbol: string): HistoricalDataPoint[] {
    const result: HistoricalDataPoint[] = [];
    const today = new Date();

    // Base values for different symbols
    let baseValue = 0;
    switch (symbol) {
      case 'AAPL':
        baseValue = 170;
        break;
      case 'MSFT':
        baseValue = 370;
        break;
      case 'GOOGL':
        baseValue = 150;
        break;
      case 'AMZN':
        baseValue = 170;
        break;
      case 'TSLA':
        baseValue = 200;
        break;
      default:
        baseValue = 100;
    }

    // Generate data points for each day (365 days)
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Add some random variation
      const randomFactor = 0.02; // 2% max variation
      const dailyVariation = baseValue * randomFactor * (Math.random() * 2 - 1);
      const open = baseValue + dailyVariation;
      const high = open * (1 + Math.random() * 0.01);
      const low = open * (1 - Math.random() * 0.01);
      const close = (high + low) / 2;
      const volume = baseValue * 1000 * (0.8 + Math.random() * 0.4);

      // Update base value for next day
      baseValue = close;

      result.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(close.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume: parseFloat(volume.toFixed(2))
      });
    }

    return result;
  }
}

export default AlphaVantageService;