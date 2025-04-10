import axios from 'axios';
import { LRUCache } from 'lru-cache';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * Secure Market Data Service
 *
 * This service handles all market data requests through our secure API proxy
 * instead of directly calling external APIs with client-side API keys.
 */
export class SecureMarketDataService {
  private cache: LRUCache<string, any>;
  private useMockData: boolean;

  constructor(useMockData: boolean = true) {
    console.log(`[SecureMarketDataService] Initializing service (Mock Data: ${useMockData})`);

    // Initialize LRU cache with max 500 entries, each expiring after 5 minutes
    this.cache = new LRUCache<string, any>({
      max: 500,
      ttl: 1000 * 60 * 5 // 5 minutes
    });

    this.useMockData = useMockData;
  }

  /**
   * Generate a cache key based on method name and parameters
   */
  private generateCacheKey(method: string, ...args: any[]): string {
    return `${method}:${args.join(':')}`;
  }

  /**
   * Handle API errors with proper logging
   */
  private handleAPIError(error: unknown, context: string): void {
    // Log a generic error message without exposing details
    console.error(`API Error in ${context}`);

    // Log detailed error information
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } else if (error instanceof Error) {
      console.error('Error Details:', error.message);
    }
  }

  /**
   * Provide mock data for testing or when real data is unavailable
   */
  private getMockData(method: string, ...args: any[]): any {
    switch (method) {
      case 'listAvailableAssets':
        const category = args[0]?.category;
        if (category === 'Cryptocurrency') {
          return [
            { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
            { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' },
            { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency' },
            { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency' },
            { symbol: 'XRP', name: 'Ripple', type: 'Cryptocurrency' }
          ];
        } else if (category === 'Stocks') {
          return [
            { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks' },
            { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks' },
            { symbol: 'GOOGL', name: 'Alphabet Inc', type: 'Stocks' },
            { symbol: 'AMZN', name: 'Amazon.com Inc', type: 'Stocks' },
            { symbol: 'TSLA', name: 'Tesla Inc', type: 'Stocks' }
          ];
        } else if (category === 'Commodities') {
          return [
            { symbol: 'GC', name: 'Gold', type: 'Commodities' },
            { symbol: 'SI', name: 'Silver', type: 'Commodities' },
            { symbol: 'PL', name: 'Platinum', type: 'Commodities' },
            { symbol: 'CL', name: 'Crude Oil', type: 'Commodities' },
            { symbol: 'NG', name: 'Natural Gas', type: 'Commodities' }
          ];
        } else if (category === 'Indices') {
          return [
            { symbol: 'SPX', name: 'S&P 500', type: 'Indices' },
            { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices' },
            { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices' },
            { symbol: 'RUT', name: 'Russell 2000', type: 'Indices' },
            { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices' }
          ];
        } else {
          // Return a mix of all asset types
          return [
            { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
            { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks' },
            { symbol: 'GC', name: 'Gold', type: 'Commodities' },
            { symbol: 'SPX', name: 'S&P 500', type: 'Indices' },
            { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' }
          ];
        }

      case 'getAssetPriceInBTC':
        const symbol = args[0];
        if (symbol === 'BTC') {
          return {
            symbol: 'BTC',
            price: 67890.12,
            change: 1234.56,
            changePercent: 2.34,
            priceInBTC: 1.0,
            priceInUSD: 67890.12,
            lastUpdated: new Date().toISOString()
          };
        } else if (symbol === 'ETH') {
          return {
            symbol: 'ETH',
            price: 3456.78,
            change: 123.45,
            changePercent: 3.45,
            priceInBTC: 0.05,
            priceInUSD: 3456.78,
            lastUpdated: new Date().toISOString()
          };
        } else if (symbol === 'AAPL') {
          return {
            symbol: 'AAPL',
            price: 189.50,
            change: 2.30,
            changePercent: 1.23,
            priceInBTC: 0.0028,
            priceInUSD: 189.50,
            lastUpdated: new Date().toISOString()
          };
        } else if (symbol === 'GC') {
          return {
            symbol: 'GC',
            price: 2345.67,
            change: 12.34,
            changePercent: 0.53,
            priceInBTC: 0.035,
            priceInUSD: 2345.67,
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Default for any other symbol
          return {
            symbol: symbol,
            price: 1000 + Math.random() * 1000,
            change: Math.random() * 100,
            changePercent: Math.random() * 5,
            priceInBTC: 0.01 + Math.random() * 0.1,
            priceInUSD: 1000 + Math.random() * 1000,
            lastUpdated: new Date().toISOString()
          };
        }

      case 'getHistoricalData':
        return Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          price: 50000 + Math.random() * 1000,
          open: 50000 + Math.random() * 1000,
          high: 51000 + Math.random() * 1000,
          low: 49000 + Math.random() * 1000,
          close: 50000 + Math.random() * 1000,
          volume: 1000000 + Math.random() * 1000000
        }));

      default:
        return null;
    }
  }

  /**
   * List available assets by category
   */
  async listAvailableAssets(options: {
    category?: AssetCategory;
    page?: number;
    pageSize?: number;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    const { category, page = 1, pageSize = 20 } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey('listAvailableAssets', JSON.stringify(options));
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult as MarketAsset[];
    }

    // Return mock data if enabled
    if (this.useMockData) {
      const mockData = this.getMockData('listAvailableAssets', options);
      this.cache.set(cacheKey, mockData);
      return mockData;
    }

    try {
      // Determine which endpoint to call based on category
      const endpoint = category === 'Cryptocurrency' ? 'crypto' : 'stocks';

      // Call our secure API proxy
      const response = await axios.get('/api/market-data', {
        params: {
          endpoint,
          page,
          pageSize
        }
      });

      // Cache and return the result
      const assets = response.data.data;
      this.cache.set(cacheKey, assets);
      return assets;
    } catch (error) {
      this.handleAPIError(error, 'listAvailableAssets');

      // Return mock data on error if mock data is enabled
      if (this.useMockData) {
        const mockData = this.getMockData('listAvailableAssets', options);
        return mockData;
      }

      // Return empty array on error
      return [];
    }
  }

  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData | null> {
    // Generate cache key
    const cacheKey = this.generateCacheKey('getAssetPriceInBTC', assetSymbol);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult as AssetData;
    }

    // Return mock data if enabled
    if (this.useMockData) {
      const mockData = this.getMockData('getAssetPriceInBTC', assetSymbol);
      this.cache.set(cacheKey, mockData);
      return mockData;
    }

    try {
      // Call our secure API proxy
      const response = await axios.get('/api/crypto/bitcoin-price', {
        params: {
          symbol: assetSymbol
        }
      });

      // Cache and return the result
      const assetData = response.data;
      this.cache.set(cacheKey, assetData);
      return assetData;
    } catch (error) {
      this.handleAPIError(error, `getAssetPriceInBTC for ${assetSymbol}`);

      // Return mock data on error if mock data is enabled
      if (this.useMockData) {
        const mockData = this.getMockData('getAssetPriceInBTC', assetSymbol);
        return mockData;
      }

      return null;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    // Generate cache key
    const cacheKey = this.generateCacheKey('getHistoricalData', symbol, days);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult as HistoricalDataPoint[];
    }

    // Return mock data if enabled
    if (this.useMockData) {
      const mockData = this.getMockData('getHistoricalData', symbol, days);
      this.cache.set(cacheKey, mockData);
      return mockData;
    }

    try {
      // Call our secure API proxy
      const response = await axios.get('/api/market-data', {
        params: {
          endpoint: 'historical',
          symbol,
          days
        }
      });

      // Cache and return the result
      const historicalData = response.data.data;
      this.cache.set(cacheKey, historicalData);
      return historicalData;
    } catch (error) {
      this.handleAPIError(error, `getHistoricalData for ${symbol}`);

      // Return mock data on error if mock data is enabled
      if (this.useMockData) {
        const mockData = this.getMockData('getHistoricalData', symbol, days);
        return mockData;
      }

      return [];
    }
  }

  /**
   * Determine if a symbol is a cryptocurrency
   */
  isCryptoCurrency(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC'];
    return cryptoSymbols.includes(symbol.split(':')[0].toUpperCase());
  }
}

export default SecureMarketDataService;
