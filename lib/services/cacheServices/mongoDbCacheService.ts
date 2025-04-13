import mongoose from 'mongoose';
import { Logger } from 'winston';

class MongoDbCacheService {
  private longCacheTtl: number;
  private logger: Logger;

  constructor(longCacheTtl: number, logger: Logger) {
    this.longCacheTtl = longCacheTtl;
    this.logger = logger;
  }

  // ...existing code...

  /**
   * Cache asset data for a specific symbol
   */
  async cacheAssetData(symbol: string, data: any): Promise<void> {
    try {
      const cacheEntry = {
        key: `asset-data-${symbol.toLowerCase()}`,
        data,
        expiresAt: new Date(Date.now() + this.longCacheTtl)
      };

      // Use Asset model (or AssetData if it exists)
      await mongoose.model('Asset').findOneAndUpdate(
        { key: cacheEntry.key },
        { $set: cacheEntry },
        { upsert: true, new: true }
      );

      this.logger.info(`Cached asset data for ${symbol}`);
    } catch (error) {
      this.logger.error(`Error caching asset data for ${symbol}:`, error);
    }
  }

  /**
   * Get cached asset data for a specific symbol
   */
  async getCachedAssetData(symbol: string): Promise<{ data: any; createdAt: Date } | null> {
    try {
      // Use Asset model (or AssetData if it exists)
      const result = await mongoose.model('Asset').findOne({
        key: `asset-data-${symbol.toLowerCase()}`,
        expiresAt: { $gt: new Date() }
      });

      if (result) {
        return { data: result.data, createdAt: result.createdAt };
      }
      return null;
    } catch (error) {
      this.logger.error(`Error fetching cached asset data for ${symbol}:`, error);
      return null;
    }
  }

  // ...existing code...
}

export default MongoDbCacheService;