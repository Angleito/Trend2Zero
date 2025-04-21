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
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                const connection = await dbConnect();
                // Check connection state
                if (connection.readyState !== ConnectionState.CONNECTED) {
                    throw new MongoDBConnectionError('Database not in connected state');
                }
                return connection;
            }
            catch (error) {
                retries++;
                console.warn(`MongoDB connection attempt ${retries} failed:`, error);
                if (retries >= this.maxRetries) {
                    console.error('Failed to connect to MongoDB after maximum retries');
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
     * Safely execute database operations with connection state checks
     */
    async safeExecute(operation, fallbackData) {
        try {
            // Attempt to connect
            await this.connect();
            // Execute the database operation
            return await operation();
        }
        catch (error) {
            console.error('Database operation failed:', error);
            // Provide SSR-friendly fallback if available
            if (fallbackData) {
                return {
                    data: fallbackData,
                    isCached: false
                };
            }
            // Rethrow if no fallback
            throw error;
        }
    }
    /**
     * Cache asset list data with enhanced error handling
     */
    async cacheAssetList(category, page, pageSize, data) {
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
                data: {
                    data: cache.data,
                    pagination: cache.pagination
                },
                isCached: true
            };
        });
    }
    /**
     * Cache asset price data with enhanced error handling
     */
    async cacheAssetPrice(symbol, data) {
        await this.safeExecute(async () => {
            const existingCache = await AssetPrice.findOne({ symbol });
            if (existingCache) {
                existingCache.price = data.price;
                existingCache.change = data.change;
                existingCache.changePercent = data.changePercent;
                existingCache.priceInBTC = data.priceInBTC;
                existingCache.priceInUSD = data.priceInUSD;
                existingCache.lastUpdated = data.lastUpdated;
                await existingCache.save();
            }
            else {
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
        });
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
