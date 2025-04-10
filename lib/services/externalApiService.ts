import axios from 'axios';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * External API Service
 * 
 * This service handles all external API calls to fetch market data
 * from various sources like CoinMarketCap, Alpha Vantage, and MetalPriceAPI.
 */
export class ExternalApiService {
  private coinMarketCapApiKey: string;
  private alphaVantageApiKey: string;
  private metalPriceApiKey: string;

  constructor() {
    this.coinMarketCapApiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.metalPriceApiKey = process.env.METAL_PRICE_API_KEY || '';
  }

  /**
   * Fetch cryptocurrency data from CoinMarketCap
   */
  async fetchCryptoList(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      if (!this.coinMarketCapApiKey) {
        throw new Error('CoinMarketCap API key is missing');
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
        },
        params: {
          start: (page - 1) * pageSize + 1,
          limit: pageSize,
          convert: 'USD'
        }
      });

      // Transform the response to match our expected format
      const assets = response.data.data.map((crypto: any) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        type: 'Cryptocurrency',
        description: crypto.slug
      }));

      return {
        data: assets,
        pagination: {
          page,
          pageSize,
          totalItems: response.data.status.total_count,
          totalPages: Math.ceil(response.data.status.total_count / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching crypto list:', error);
      throw error;
    }
  }

  /**
   * Fetch stock data from Alpha Vantage
   */
  async fetchStockList(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      if (!this.alphaVantageApiKey) {
        throw new Error('Alpha Vantage API key is missing');
      }

      // Alpha Vantage doesn't have a paginated list endpoint
      // This is a simplified implementation using their search endpoint
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: 'technology', // Example search term
          apikey: this.alphaVantageApiKey
        }
      });

      if (!response.data.bestMatches) {
        throw new Error('Invalid response from Alpha Vantage');
      }

      // Apply pagination manually
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, response.data.bestMatches.length);
      const paginatedResults = response.data.bestMatches.slice(start, end);

      // Transform the response to match our expected format
      const assets = paginatedResults.map((stock: any) => ({
        symbol: stock['1. symbol'],
        name: stock['2. name'],
        type: 'Stocks',
        description: stock['4. region']
      }));

      return {
        data: assets,
        pagination: {
          page,
          pageSize,
          totalItems: response.data.bestMatches.length,
          totalPages: Math.ceil(response.data.bestMatches.length / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching stock list:', error);
      throw error;
    }
  }

  /**
   * Fetch commodity data from MetalPriceAPI
   */
  async fetchCommoditiesList(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      if (!this.metalPriceApiKey) {
        throw new Error('Metal Price API key is missing');
      }

      // MetalPriceAPI doesn't have a paginated list endpoint
      // This is a simplified implementation
      const response = await axios.get('https://api.metalpriceapi.com/v1/latest', {
        params: {
          api_key: this.metalPriceApiKey,
          base: 'USD',
          currencies: 'XAU,XAG,XPT,XPD,BRENT,WTI'
        }
      });

      // Define commodity mapping
      const commodityMap: Record<string, { name: string, description: string }> = {
        'XAU': { name: 'Gold', description: 'Precious metal' },
        'XAG': { name: 'Silver', description: 'Precious metal' },
        'XPT': { name: 'Platinum', description: 'Precious metal' },
        'XPD': { name: 'Palladium', description: 'Precious metal' },
        'BRENT': { name: 'Brent Crude Oil', description: 'Energy' },
        'WTI': { name: 'WTI Crude Oil', description: 'Energy' }
      };

      // Transform the response to match our expected format
      const assets = Object.keys(response.data.rates).map(symbol => ({
        symbol,
        name: commodityMap[symbol]?.name || symbol,
        type: 'Commodities',
        description: commodityMap[symbol]?.description || 'Commodity'
      }));

      // Apply pagination manually
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, assets.length);
      const paginatedResults = assets.slice(start, end);

      return {
        data: paginatedResults,
        pagination: {
          page,
          pageSize,
          totalItems: assets.length,
          totalPages: Math.ceil(assets.length / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching commodities list:', error);
      throw error;
    }
  }

  /**
   * Fetch indices data
   * Note: This is a placeholder as we don't have a specific API for indices
   */
  async fetchIndicesList(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      if (!this.alphaVantageApiKey) {
        throw new Error('Alpha Vantage API key is missing');
      }

      // Using Alpha Vantage for indices data
      // This is a simplified implementation
      const indices = [
        { symbol: 'SPX', name: 'S&P 500', type: 'Indices', description: 'US large-cap stocks' },
        { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', description: 'US blue-chip stocks' },
        { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', description: 'US technology stocks' },
        { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', description: 'US small-cap stocks' },
        { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', description: 'UK large-cap stocks' },
        { symbol: 'DAX', name: 'DAX', type: 'Indices', description: 'German stocks' },
        { symbol: 'CAC', name: 'CAC 40', type: 'Indices', description: 'French stocks' },
        { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', description: 'Japanese stocks' },
        { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', description: 'Hong Kong stocks' },
        { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', description: 'Chinese stocks' }
      ];

      // Apply pagination manually
      const start = (page - 1) * pageSize;
      const end = Math.min(start + pageSize, indices.length);
      const paginatedResults = indices.slice(start, end);

      return {
        data: paginatedResults,
        pagination: {
          page,
          pageSize,
          totalItems: indices.length,
          totalPages: Math.ceil(indices.length / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching indices list:', error);
      throw error;
    }
  }

  /**
   * Fetch asset price data
   */
  async fetchAssetPrice(symbol: string): Promise<AssetData> {
    try {
      // Determine the API to use based on the asset type
      if (this.isCryptoCurrency(symbol)) {
        return this.fetchCryptoPrice(symbol);
      } else if (this.isCommodity(symbol)) {
        return this.fetchCommodityPrice(symbol);
      } else {
        return this.fetchStockPrice(symbol);
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch cryptocurrency price from CoinMarketCap
   */
  private async fetchCryptoPrice(symbol: string): Promise<AssetData> {
    try {
      if (!this.coinMarketCapApiKey) {
        throw new Error('CoinMarketCap API key is missing');
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
        },
        params: {
          symbol,
          convert: 'USD,BTC'
        }
      });

      const cryptoData = response.data.data[symbol];
      const usdQuote = cryptoData.quote.USD;
      const bitcoinPrice = await this.getBitcoinPrice();
      const btcQuote = cryptoData.quote.BTC || { price: usdQuote.price / bitcoinPrice };

      return {
        symbol,
        price: usdQuote.price,
        change: usdQuote.volume_change_24h,
        changePercent: usdQuote.percent_change_24h,
        priceInBTC: btcQuote.price,
        priceInUSD: usdQuote.price,
        lastUpdated: new Date(usdQuote.last_updated).toISOString()
      };
    } catch (error) {
      console.error(`Error fetching crypto price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch stock price from Alpha Vantage
   */
  private async fetchStockPrice(symbol: string): Promise<AssetData> {
    try {
      if (!this.alphaVantageApiKey) {
        throw new Error('Alpha Vantage API key is missing');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.alphaVantageApiKey
        }
      });

      const quote = response.data['Global Quote'];
      if (!quote) {
        throw new Error(`No data found for stock ${symbol}`);
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      const bitcoinPrice = await this.getBitcoinPrice();
      const priceInBTC = price / bitcoinPrice;

      return {
        symbol,
        price,
        change,
        changePercent,
        priceInBTC,
        priceInUSD: price,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching stock price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch commodity price from MetalPriceAPI
   */
  private async fetchCommodityPrice(symbol: string): Promise<AssetData> {
    try {
      if (!this.metalPriceApiKey) {
        throw new Error('Metal Price API key is missing');
      }

      const response = await axios.get('https://api.metalpriceapi.com/v1/latest', {
        params: {
          api_key: this.metalPriceApiKey,
          base: 'USD',
          currencies: symbol
        }
      });

      if (!response.data.rates || !response.data.rates[symbol]) {
        throw new Error(`No data found for commodity ${symbol}`);
      }

      // MetalPriceAPI returns rates as USD/COMMODITY, so we need to invert
      const rate = 1 / response.data.rates[symbol];
      const bitcoinPrice = await this.getBitcoinPrice();
      const priceInBTC = rate / bitcoinPrice;

      return {
        symbol,
        price: rate,
        change: 0, // MetalPriceAPI doesn't provide change data
        changePercent: 0,
        priceInBTC,
        priceInUSD: rate,
        lastUpdated: new Date(response.data.timestamp * 1000).toISOString()
      };
    } catch (error) {
      console.error(`Error fetching commodity price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch historical data for an asset
   */
  async fetchHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    try {
      // Determine the API to use based on the asset type
      if (this.isCryptoCurrency(symbol)) {
        return this.fetchCryptoHistoricalData(symbol, days);
      } else if (this.isCommodity(symbol)) {
        return this.fetchCommodityHistoricalData(symbol, days);
      } else {
        return this.fetchStockHistoricalData(symbol, days);
      }
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch cryptocurrency historical data from CoinMarketCap
   */
  private async fetchCryptoHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
    try {
      if (!this.coinMarketCapApiKey) {
        throw new Error('CoinMarketCap API key is missing');
      }

      // CoinMarketCap doesn't have a free historical data endpoint
      // Using a workaround with Alpha Vantage for crypto historical data
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'DIGITAL_CURRENCY_DAILY',
          symbol,
          market: 'USD',
          apikey: this.alphaVantageApiKey
        }
      });

      if (!response.data['Time Series (Digital Currency Daily)']) {
        throw new Error(`No historical data found for crypto ${symbol}`);
      }

      const timeSeriesData = response.data['Time Series (Digital Currency Daily)'];
      const dates = Object.keys(timeSeriesData).sort().reverse().slice(0, days);

      return dates.map(date => {
        const dataPoint = timeSeriesData[date];
        return {
          date: new Date(date),
          price: parseFloat(dataPoint['4a. close (USD)']),
          open: parseFloat(dataPoint['1a. open (USD)']),
          high: parseFloat(dataPoint['2a. high (USD)']),
          low: parseFloat(dataPoint['3a. low (USD)']),
          close: parseFloat(dataPoint['4a. close (USD)']),
          volume: parseFloat(dataPoint['5. volume'])
        };
      });
    } catch (error) {
      console.error(`Error fetching crypto historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch stock historical data from Alpha Vantage
   */
  private async fetchStockHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
    try {
      if (!this.alphaVantageApiKey) {
        throw new Error('Alpha Vantage API key is missing');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: days > 100 ? 'full' : 'compact',
          apikey: this.alphaVantageApiKey
        }
      });

      if (!response.data['Time Series (Daily)']) {
        throw new Error(`No historical data found for stock ${symbol}`);
      }

      const timeSeriesData = response.data['Time Series (Daily)'];
      const dates = Object.keys(timeSeriesData).sort().reverse().slice(0, days);

      return dates.map(date => {
        const dataPoint = timeSeriesData[date];
        return {
          date: new Date(date),
          price: parseFloat(dataPoint['4. close']),
          open: parseFloat(dataPoint['1. open']),
          high: parseFloat(dataPoint['2. high']),
          low: parseFloat(dataPoint['3. low']),
          close: parseFloat(dataPoint['4. close']),
          volume: parseFloat(dataPoint['5. volume'])
        };
      });
    } catch (error) {
      console.error(`Error fetching stock historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Fetch commodity historical data
   * Note: This is a placeholder as MetalPriceAPI doesn't have a free historical endpoint
   */
  private async fetchCommodityHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
    try {
      // For commodities, we'll use Alpha Vantage's forex data as a proxy
      // This is a simplified implementation
      if (!this.alphaVantageApiKey) {
        throw new Error('Alpha Vantage API key is missing');
      }

      // Map commodity symbols to forex symbols
      const forexMap: Record<string, string> = {
        'XAU': 'XAUUSD', // Gold
        'XAG': 'XAGUSD', // Silver
        'XPT': 'XPTUSD', // Platinum
        'XPD': 'XPDUSD', // Palladium
        'BRENT': 'USDBRO', // Brent Crude Oil
        'WTI': 'USDWTI'  // WTI Crude Oil
      };

      const forexSymbol = forexMap[symbol] || symbol;

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'FX_DAILY',
          from_symbol: forexSymbol.substring(0, 3),
          to_symbol: forexSymbol.substring(3, 6),
          outputsize: days > 100 ? 'full' : 'compact',
          apikey: this.alphaVantageApiKey
        }
      });

      if (!response.data['Time Series FX (Daily)']) {
        throw new Error(`No historical data found for commodity ${symbol}`);
      }

      const timeSeriesData = response.data['Time Series FX (Daily)'];
      const dates = Object.keys(timeSeriesData).sort().reverse().slice(0, days);

      return dates.map(date => {
        const dataPoint = timeSeriesData[date];
        return {
          date: new Date(date),
          price: parseFloat(dataPoint['4. close']),
          open: parseFloat(dataPoint['1. open']),
          high: parseFloat(dataPoint['2. high']),
          low: parseFloat(dataPoint['3. low']),
          close: parseFloat(dataPoint['4. close']),
          volume: 0 // Forex data doesn't include volume
        };
      });
    } catch (error) {
      console.error(`Error fetching commodity historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get the current Bitcoin price
   */
  private async getBitcoinPrice(): Promise<number> {
    try {
      if (!this.coinMarketCapApiKey) {
        throw new Error('CoinMarketCap API key is missing');
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
        },
        params: {
          symbol: 'BTC',
          convert: 'USD'
        }
      });

      return response.data.data.BTC.quote.USD.price;
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      // Return a fallback price if the API call fails
      return 50000;
    }
  }

  /**
   * Determine if a symbol is a cryptocurrency
   */
  private isCryptoCurrency(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC'];
    return cryptoSymbols.includes(symbol.split(':')[0].toUpperCase());
  }

  /**
   * Determine if a symbol is a commodity
   */
  private isCommodity(symbol: string): boolean {
    const commoditySymbols = ['XAU', 'XAG', 'XPT', 'XPD', 'BRENT', 'WTI'];
    return commoditySymbols.includes(symbol.toUpperCase());
  }
}

export default ExternalApiService;
