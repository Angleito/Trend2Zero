import mongoose from 'mongoose';
class MongoDbCacheService {
    constructor(longCacheTtl, logger) {
        this.longCacheTtl = longCacheTtl;
        this.logger = logger;
    }
    // ...existing code...
    /**
     * Cache asset data for a specific symbol
     */
    async cacheAssetData(symbol, data) {
        try {
            const cacheEntry = {
                key: `asset-data-${symbol.toLowerCase()}`,
                data,
                expiresAt: new Date(Date.now() + this.longCacheTtl)
            };
            // Use Asset model (or AssetData if it exists)
            await mongoose.model('Asset').findOneAndUpdate({ key: cacheEntry.key }, { $set: cacheEntry }, { upsert: true, new: true });
            this.logger.info(`Cached asset data for ${symbol}`);
        }
        catch (error) {
            this.logger.error(`Error caching asset data for ${symbol}:`, error);
        }
    }
    /**
     * Get cached asset data for a specific symbol
     */
    async getCachedAssetData(symbol) {
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
        }
        catch (error) {
            this.logger.error(`Error fetching cached asset data for ${symbol}:`, error);
            return null;
        }
    }
}
export default MongoDbCacheService;
