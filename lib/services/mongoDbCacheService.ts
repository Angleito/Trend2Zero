import dbConnect from '../db/mongodb';
import { AssetPrice, HistoricalData, AssetList, IAssetPrice, IHistoricalData, IAssetList } from '../db/models/assetCache';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * MongoDB Cache Service
 * 
 * This service handles caching market data in MongoDB
 * and retrieving cached data when API calls fail.
 */
export class MongoDbCacheService {
  private cacheExpiryTime: number;

  constructor() {
    // Cache expiry time in milliseconds (default: 1 hour)
    this.cacheExpiryTime = 60 * 60 * 1000;
  }

  /**
   * Connect to MongoDB
   */
  private async connect() {
    await dbConnect();
  }

  /**
   * Check if cache is valid (not expired)
   */
  private isCacheValid(updatedAt: Date): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - updatedAt.getTime();
    return cacheAge < this.cacheExpiryTime;
  }

  /**
   * Cache asset list data
   */
  async cacheAssetList(category: string, page: number, pageSize: number, data: any): Promise<void> {
    try {
      await this.connect();

      // Check if cache exists
      const existingCache = await AssetList.findOne({
        category,
        page,
        pageSize
      });

      if (existingCache) {
        // Update existing cache
        existingCache.data = data.data;
        existingCache.pagination = data.pagination;
        await existingCache.save();
      } else {
        // Create new cache
        await AssetList.create({
          category,
          page,
          pageSize,
          data: data.data,
          pagination: data.pagination
        });
      }
    } catch (error) {
      console.error('Error caching asset list:', error);
    }
  }

  /**
   * Get cached asset list data
   */
  async getCachedAssetList(category: string, page: number, pageSize: number): Promise<any | null> {
    try {
      await this.connect();

      // Find cache
      const cache = await AssetList.findOne({
        category,
        page,
        pageSize
      }).sort({ updatedAt: -1 });

      // Return null if cache doesn't exist or is expired
      if (!cache || !this.isCacheValid(cache.updatedAt)) {
        return null;
      }

      return {
        data: cache.data,
        pagination: cache.pagination
      };
    } catch (error) {
      console.error('Error getting cached asset list:', error);
      return null;
    }
  }

  /**
   * Cache asset price data
   */
  async cacheAssetPrice(symbol: string, data: AssetData): Promise<void> {
    try {
      await this.connect();

      // Check if cache exists
      const existingCache = await AssetPrice.findOne({ symbol });

      if (existingCache) {
        // Update existing cache
        existingCache.price = data.price;
        existingCache.change = data.change;
        existingCache.changePercent = data.changePercent;
        existingCache.priceInBTC = data.priceInBTC;
        existingCache.priceInUSD = data.priceInUSD;
        existingCache.lastUpdated = data.lastUpdated;
        await existingCache.save();
      } else {
        // Create new cache
        await AssetPrice.create({
          symbol: data.symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          priceInBTC: data.priceInBTC,
          priceInUSD: data.priceInUSD,
          lastUpdated: data.lastUpdated
        });
      }
    } catch (error) {
      console.error('Error caching asset price:', error);
    }
  }

  /**
   * Get cached asset price data
   */
  async getCachedAssetPrice(symbol: string): Promise<AssetData | null> {
    try {
      await this.connect();

      // Find cache
      const cache = await AssetPrice.findOne({ symbol }).sort({ updatedAt: -1 });

      // Return null if cache doesn't exist or is expired
      if (!cache || !this.isCacheValid(cache.updatedAt)) {
        return null;
      }

      return {
        symbol: cache.symbol,
        price: cache.price,
        change: cache.change,
        changePercent: cache.changePercent,
        priceInBTC: cache.priceInBTC,
        priceInUSD: cache.priceInUSD,
        lastUpdated: cache.lastUpdated
      };
    } catch (error) {
      console.error('Error getting cached asset price:', error);
      return null;
    }
  }

  /**
   * Cache historical data
   */
  async cacheHistoricalData(symbol: string, days: number, data: HistoricalDataPoint[]): Promise<void> {
    try {
      await this.connect();

      // Check if cache exists
      const existingCache = await HistoricalData.findOne({ symbol, days });

      if (existingCache) {
        // Update existing cache
        existingCache.data = data.map(point => ({
          date: point.date,
          price: point.price,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume
        }));
        await existingCache.save();
      } else {
        // Create new cache
        await HistoricalData.create({
          symbol,
          days,
          data: data.map(point => ({
            date: point.date,
            price: point.price,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume
          }))
        });
      }
    } catch (error) {
      console.error('Error caching historical data:', error);
    }
  }

  /**
   * Get cached historical data
   */
  async getCachedHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[] | null> {
    try {
      await this.connect();

      // Find cache
      const cache = await HistoricalData.findOne({ symbol, days }).sort({ updatedAt: -1 });

      // Return null if cache doesn't exist or is expired
      if (!cache || !this.isCacheValid(cache.updatedAt)) {
        return null;
      }

      return cache.data.map(point => ({
        date: point.date,
        price: point.price,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume
      }));
    } catch (error) {
      console.error('Error getting cached historical data:', error);
      return null;
    }
  }
}

export default MongoDbCacheService;
