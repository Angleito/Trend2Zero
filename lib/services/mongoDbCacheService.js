import dbConnect, { ConnectionState } from '../db/mongodb';
import { AssetPrice, HistoricalData, AssetList, CryptoDetection } from '../db/models/assetCache';
// Custom error for MongoDB connection issues
class MongoDBConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MongoDBConnectionError';
    }
}
/**
 * MongoDB Cache Service
 *
 * Enhanced service for handling market data caching with robust
 * connection state management and SSR support
 */
export class MongoDbCacheService {
    constructor() {
        // Cache expiry time in milliseconds (default: 1 hour)
        this.cacheExpiryTime = 60 * 60 * 1000;
        // Maximum connection retries
        this.maxRetries = 3;
        // Retry delay between connection attempts (ms)
        this.retryDelay = 1000;
    }
    /**
     * Advanced connection method with retry and state management
     */
    async connect() {
        // Check if in development mode
        const isDev = process.env.NODE_ENV !== 'production';
        const disableMongoDB = process.env.DISABLE_MONGODB === 'true';
        
        // If MongoDB is explicitly disabled, return mock connection
        if (disableMongoDB) {
            console.log('[MongoDB] MongoDB disabled via environment, using mock connection');
            return this._createMockConnection();
        }
        
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                const connection = await dbConnect();
                // Check connection state
                if (connection.readyState !== ConnectionState.CONNECTED) {
                    if (isDev) {
                        console.warn('[MongoDB] Development mode: Using mock connection');
                        return this._createMockConnection();
                    }
                    throw new MongoDBConnectionError('Database not in connected state');
                }
                return connection;
            }
            catch (error) {
                retries++;
                console.warn(`[MongoDB] Connection attempt ${retries} failed:`, error);
                
                // In development mode, return mock connection instead of failing
                if (isDev) {
                    console.warn('[MongoDB] Development mode: Using mock connection');
                    return this._createMockConnection();
                }
                
                if (retries >= this.maxRetries) {
                    console.error('[MongoDB] All connection attempts failed');
                    throw new MongoDBConnectionError('Persistent connection failure');
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
        throw new MongoDBConnectionError('Unexpected connection failure');
    }
    /**
     * Check if cache is valid (not expired)
     */
    isCacheValid(updatedAt) {
        const now = new Date();
        const cacheAge = now.getTime() - updatedAt.getTime();
        return cacheAge < this.cacheExpiryTime;
    }
    /**
     * Create a mock MongoDB connection for development
     * @private
     */
    _createMockConnection() {
        return {
            readyState: ConnectionState.CONNECTED,
            on: () => {},
            once: () => {},
            db: { collection: () => ({ find: () => ({ toArray: () => [] }) }) },
            connection: { db: () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }) }
        };
    }
    
    /**
     * Safely execute database operations with connection state checks
     */
    async safeExecute(operation, fallbackData) {
        try {
            // If MongoDB is disabled, return fallback data immediately
            if (process.env.DISABLE_MONGODB === 'true') {
                console.log('[MongoDB] Database disabled, returning fallback data');
                return fallbackData ? { data: fallbackData, isCached: false } : null;
            }

            // Attempt to connect
            await this.connect();
            // Execute the database operation
            return await operation();
        }
        catch (error) {
            console.error('[MongoDB] Database operation failed:', error);
            // Provide SSR-friendly fallback if available
            if (fallbackData) {
                return {
                    data: fallbackData,
                    isCached: false
                };
            }
            // Return null instead of throwing to prevent unhandled rejections
            return null;
        }
    }
    
    /**
     * Cache asset list data with enhanced error handling
     */
    async cacheAssetList(category, page, pageSize, data) {
        try {
            if (process.env.DISABLE_MONGODB === 'true') {
                return;
            }
            
            await this.safeExecute(async () => {
                const existingCache = await AssetList.findOne({
                    category,
                    page,
                    pageSize
                });
                if (existingCache) {
                    existingCache.data = data.data;
                    existingCache.pagination = data.pagination;
                    await existingCache.save();
                }
                else {
                    await AssetList.create({
                        category,
                        page,
                        pageSize,
                        data: data.data,
                        pagination: data.pagination
                    });
                }
            });
        } catch (error) {
            // Swallow errors in development mode
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[MongoDB] Cache operation failed (safe to ignore in development):', error.message);
            } else {
                // In production, log but don't throw to prevent app crashes
                console.error('[MongoDB] Cache operation failed:', error);
            }
        }
    }
    /**
     * Get cached asset list with SSR support and connection state management
     */
    async getCachedAssetList(category, page, pageSize) {
        return this.safeExecute(async () => {
            const cache = await AssetList.findOne({
                category,
                page,
                pageSize
            }).sort({ updatedAt: -1 });
            if (!cache || !this.isCacheValid(cache.updatedAt)) {
                return null;
            }
            return {
                data: cache.data,
                pagination: cache.pagination,
                isCached: true
            };
        });
    }
    /**
     * Cache asset price data with enhanced error handling
     */
    async cacheAssetPrice(symbol, data) {
        try {
            if (process.env.DISABLE_MONGODB === 'true') {
                return;
            }
            
            await this.safeExecute(async () => {
                const existingCache = await AssetPrice.findOne({ symbol });
                if (existingCache) {
                    existingCache.price = data.price;
                    existingCache.priceInUSD = data.priceInUSD || data.price;
                    existingCache.priceInBTC = data.priceInBTC;
                    existingCache.change = data.change;
                    existingCache.changePercent = data.changePercent;
                    existingCache.lastUpdated = data.lastUpdated || new Date();
                    await existingCache.save();
                }
                else {
                    await AssetPrice.create({
                        symbol,
                        name: data.name || symbol,
                        price: data.price,
                        priceInUSD: data.priceInUSD || data.price,
                        priceInBTC: data.priceInBTC,
                        change: data.change,
                        changePercent: data.changePercent,
                        lastUpdated: data.lastUpdated || new Date()
                    });
                }
            });
        } catch (error) {
            // Swallow errors in development mode
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[MongoDB] Cache operation failed (safe to ignore in development):', error.message);
            } else {
                // In production, log but don't throw to prevent app crashes
                console.error('[MongoDB] Cache operation failed:', error);
            }
        }
    }
    /**
     * Get cached asset price with SSR support and connection state management
     */
    async getCachedAssetPrice(symbol, fallbackPrice) {
        return this.safeExecute(async () => {
            const cache = await AssetPrice.findOne({ symbol }).sort({ updatedAt: -1 });
            if (!cache || !this.isCacheValid(cache.updatedAt)) {
                return null;
            }
            return {
                data: {
                    symbol: cache.symbol,
                    price: cache.price,
                    change: cache.change,
                    changePercent: cache.changePercent,
                    priceInBTC: cache.priceInBTC,
                    priceInUSD: cache.priceInUSD,
                    lastUpdated: cache.lastUpdated
                },
                isCached: true
            };
        }, fallbackPrice);
    }
    /**
     * Cache historical data with enhanced error handling
     */
    async cacheHistoricalData(symbol, days, data) {
        try {
            if (process.env.DISABLE_MONGODB === 'true') {
                return;
            }
            
            await this.safeExecute(async () => {
                const existingCache = await HistoricalData.findOne({ symbol, days });
                if (existingCache) {
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
                }
                else {
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
            });
        } catch (error) {
            // Swallow errors in development mode
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[MongoDB] Cache operation failed (safe to ignore in development):', error.message);
            } else {
                // In production, log but don't throw to prevent app crashes
                console.error('[MongoDB] Cache operation failed:', error);
            }
        }
    }
    /**
     * Get cached historical data with SSR support and connection state management
     */
    async getCachedHistoricalData(symbol, days, fallbackData) {
        return this.safeExecute(async () => {
            const cache = await HistoricalData.findOne({ symbol, days }).sort({ updatedAt: -1 });
            if (!cache || !this.isCacheValid(cache.updatedAt)) {
                return null;
            }
            return {
                data: cache.data.map((point) => ({
                    date: point.date,
                    price: point.price,
                    open: point.open,
                    high: point.high,
                    low: point.low,
                    close: point.close,
                    volume: point.volume
                })),
                isCached: true
            };
        }, fallbackData);
    }
    /**
     * Cache cryptocurrency detection results
     * @param address Contract address or wallet address to check
     * @param network Blockchain network (e.g., 'ethereum', 'bitcoin')
     * @param detectionResult The detection analysis results
     */
    async cacheCryptoDetection(address, network, detectionResult) {
        try {
            if (process.env.DISABLE_MONGODB === 'true') {
                return;
            }
            
            await this.safeExecute(async () => {
                const existingCache = await CryptoDetection.findOne({
                    address,
                    network
                });
                if (existingCache) {
                    existingCache.detectionResult = detectionResult;
                    await existingCache.save();
                }
                else {
                    await CryptoDetection.create({
                        address,
                        network,
                        detectionResult
                    });
                }
            });
        } catch (error) {
            // Swallow errors in development mode
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[MongoDB] Cache operation failed (safe to ignore in development):', error.message);
            } else {
                // In production, log but don't throw to prevent app crashes
                console.error('[MongoDB] Cache operation failed:', error);
            }
        }
    }
    /**
     * Get cached cryptocurrency detection result
     * @param address Contract address or wallet address to check
     * @param network Blockchain network
     * @returns Detection result or null if not found or expired
     */
    async getCachedCryptoDetection(address, network) {
        return this.safeExecute(async () => {
            const cache = await CryptoDetection.findOne({
                address,
                network
            });
            if (cache && this.isCacheValid(cache.updatedAt)) {
                return {
                    data: cache.detectionResult,
                    isCached: true
                };
            }
            return null;
        }, null);
    }
}
export default MongoDbCacheService;
