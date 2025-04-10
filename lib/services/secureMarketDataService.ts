import axios from 'axios';
import { LRUCache } from 'lru-cache';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';
import ExternalApiService from './externalApiService';
import MongoDbCacheService from './mongoDbCacheService';

/**
 * Secure Market Data Service
 *
 * This service handles all market data requests through our secure API proxy
 * instead of directly calling external APIs with client-side API keys.
 * It uses MongoDB for persistent caching and falls back to cached data if API calls fail.
 */
export class SecureMarketDataService {
  private cache: LRUCache<string, any>;
  private externalApiService: ExternalApiService;
  private mongoDbCacheService: MongoDbCacheService;

  constructor() {
    console.log(`[SecureMarketDataService] Initializing service`);

    // Initialize LRU cache with max 500 entries, each expiring after 5 minutes
    this.cache = new LRUCache<string, any>({
      max: 500,
      ttl: 1000 * 60 * 5 // 5 minutes
    });

    // Initialize external API service and MongoDB cache service
    this.externalApiService = new ExternalApiService();
    this.mongoDbCacheService = new MongoDbCacheService();
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

    try {
      // Determine which endpoint to call based on category
      let endpoint = 'stocks';
      if (category === 'Cryptocurrency') {
        endpoint = 'crypto';
      } else if (category === 'Commodities') {
        endpoint = 'commodities';
      } else if (category === 'Indices') {
        endpoint = 'indices';
      }

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

      // Try to get data from MongoDB cache
      try {
        const categoryStr = category || 'all';
        const cachedData = await this.mongoDbCacheService.getCachedAssetList(categoryStr, page, pageSize);
        if (cachedData) {
          console.log(`Retrieved cached asset list for ${categoryStr} from MongoDB`);
          return cachedData.data;
        }
      } catch (cacheError) {
        console.error('Error retrieving from MongoDB cache:', cacheError);
      }

      throw error;
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

    // Fallback data for static generation
    const fallbackData: Record<string, AssetData> = {
      'BTC': {
        symbol: 'BTC',
        price: 67890.12,
        change: 1234.56,
        changePercent: 2.34,
        priceInBTC: 1.0,
        priceInUSD: 67890.12,
        lastUpdated: new Date().toISOString()
      },
      'ETH': {
        symbol: 'ETH',
        price: 3456.78,
        change: 123.45,
        changePercent: 1.5,
        priceInBTC: 0.05,
        priceInUSD: 3456.78,
        lastUpdated: new Date().toISOString()
      },
      'AAPL': {
        symbol: 'AAPL',
        price: 180.50,
        change: 2.75,
        changePercent: 1.2,
        priceInBTC: 0.0025,
        priceInUSD: 180.50,
        lastUpdated: new Date().toISOString()
      },
      'GOOGL': {
        symbol: 'GOOGL',
        price: 125.75,
        change: 1.50,
        changePercent: 0.8,
        priceInBTC: 0.0018,
        priceInUSD: 125.75,
        lastUpdated: new Date().toISOString()
      }
    };

    // Return fallback data during static generation
    if (process.env.NODE_ENV === 'production') {
      const data = fallbackData[assetSymbol];
      if (data) {
        this.cache.set(cacheKey, data);
        return data;
      }
      return null;
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

      // Also cache in MongoDB for persistence
      try {
        await this.mongoDbCacheService.cacheAssetPrice(assetSymbol, assetData);
      } catch (cacheError) {
        console.error('Error caching asset price in MongoDB:', cacheError);
      }

      return assetData;
    } catch (error) {
      this.handleAPIError(error, `getAssetPriceInBTC for ${assetSymbol}`);

      // Try to get data from MongoDB cache
      try {
        const cachedData = await this.mongoDbCacheService.getCachedAssetPrice(assetSymbol);
        if (cachedData) {
          console.log(`Retrieved cached price for ${assetSymbol} from MongoDB`);
          return cachedData;
        }
      } catch (cacheError) {
        console.error('Error retrieving from MongoDB cache:', cacheError);
      }

      // If MongoDB cache fails, try to fetch directly from external API
      try {
        console.log(`Attempting to fetch ${assetSymbol} price directly from external API`);
        const externalData = await this.externalApiService.fetchAssetPrice(assetSymbol);

        // Cache the result
        this.cache.set(cacheKey, externalData);

        // Also cache in MongoDB for persistence
        try {
          await this.mongoDbCacheService.cacheAssetPrice(assetSymbol, externalData);
        } catch (cacheError) {
          console.error('Error caching asset price in MongoDB:', cacheError);
        }

        return externalData;
      } catch (externalError) {
        console.error(`Failed to fetch ${assetSymbol} price from external API:`, externalError);
      }

      // Return fallback data if all else fails
      const data = fallbackData[assetSymbol];
      if (data) {
        return data;
      }

      throw error;
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

      // Also cache in MongoDB for persistence
      try {
        await this.mongoDbCacheService.cacheHistoricalData(symbol, days, historicalData);
      } catch (cacheError) {
        console.error('Error caching historical data in MongoDB:', cacheError);
      }

      return historicalData;
    } catch (error) {
      this.handleAPIError(error, `getHistoricalData for ${symbol}`);

      // Try to get data from MongoDB cache
      try {
        const cachedData = await this.mongoDbCacheService.getCachedHistoricalData(symbol, days);
        if (cachedData) {
          console.log(`Retrieved cached historical data for ${symbol} from MongoDB`);
          return cachedData;
        }
      } catch (cacheError) {
        console.error('Error retrieving from MongoDB cache:', cacheError);
      }

      // If MongoDB cache fails, try to fetch directly from external API
      try {
        console.log(`Attempting to fetch ${symbol} historical data directly from external API`);
        const externalData = await this.externalApiService.fetchHistoricalData(symbol, days);

        // Cache the result
        this.cache.set(cacheKey, externalData);

        // Also cache in MongoDB for persistence
        try {
          await this.mongoDbCacheService.cacheHistoricalData(symbol, days, externalData);
        } catch (cacheError) {
          console.error('Error caching historical data in MongoDB:', cacheError);
        }

        return externalData;
      } catch (externalError) {
        console.error(`Failed to fetch ${symbol} historical data from external API:`, externalError);
      }

      throw error;
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
