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

  constructor() {
    console.log(`[SecureMarketDataService] Initializing service`);

    // Initialize LRU cache with max 500 entries, each expiring after 5 minutes
    this.cache = new LRUCache<string, any>({
      max: 500,
      ttl: 1000 * 60 * 5 // 5 minutes
    });
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
      return historicalData;
    } catch (error) {
      this.handleAPIError(error, `getHistoricalData for ${symbol}`);
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
