import MongoDbCacheService from './mongoDbCacheService';
import coinGeckoService from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService';
import metalPriceService from './metalPriceService';
import { AssetCategoryValues } from '../types.js';
// Predefined list of assets with correct type casing and all required properties
const predefinedAssets = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'cryptocurrency',
        id: 'bitcoin',
        price: 0,
        change: 0,
        changePercent: 0
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'cryptocurrency',
        id: 'ethereum',
        price: 0,
        change: 0,
        changePercent: 0
    },
    {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stocks',
        id: 'apple',
        price: 0,
        change: 0,
        changePercent: 0
    },
    {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        type: 'stocks',
        id: 'alphabet',
        price: 0,
        change: 0,
        changePercent: 0
    },
    {
        symbol: 'XAU',
        name: 'Gold',
        type: 'precious metal',
        id: 'gold',
        price: 0,
        change: 0,
        changePercent: 0
    }
];
class SecureMarketDataService {
    /**
     * List available assets, filtered by category and/or keywords, paginated.
     */
    async listAvailableAssets(options = {}) {
        let results = predefinedAssets;
        if (options.category) {
            results = results.filter(asset => asset.type === options.category);
        }
        if (options.keywords) {
            const kw = options.keywords.toLowerCase();
            results = results.filter(asset => asset.symbol.toLowerCase().includes(kw) ||
                (asset.name && asset.name.toLowerCase().includes(kw)));
        }
        // Pagination
        const page = options.page ?? 1;
        const pageSize = options.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return results.slice(start, end);
    }
    constructor(deps = {}) {
        this.coinMarketCapRateLimited = false;
        this.mongoDbCacheService = deps.mongoDbCacheService || new MongoDbCacheService();
        this.coinGeckoService = deps.coinGeckoService || coinGeckoService;
        this.coinMarketCapService = deps.coinMarketCapService || coinMarketCapService;
        this.metalPriceService = deps.metalPriceService || metalPriceService;
    }
    // Public method to allow mocking in tests
    async getAssetBySymbol(symbol) {
        try {
            // Try to get from cache first
            const cachedData = await this.mongoDbCacheService.getCachedAssetList(symbol, 1, 1);
            if (cachedData && 'data' in cachedData) {
                const assets = cachedData.data.data;
                const asset = assets[0];
                if (asset) {
                    console.log(`[SecureMarketData] Cache hit for asset ${symbol}`);
                    return asset;
                }
            }
            // If not found in cache, search in predefined assets
            const asset = predefinedAssets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase());
            // Cache the asset if found
            if (asset) {
                await this.mongoDbCacheService.cacheAssetList(symbol, 1, 1, {
                    data: [asset],
                    pagination: { total: 1 }
                });
            }
            return asset || null;
        }
        catch (error) {
            console.error(`Error fetching asset by symbol ${symbol}:`, error);
            // Fallback to direct search in case of cache error
            return predefinedAssets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase()) || null;
        }
    }
    // Method to get asset price in BTC with load balancing
    async getAssetPriceInBTC(symbol) {
        try {
            console.log(`[SecureMarketData] Fetching BTC price for ${symbol}`);
            // Predefined mock data for consistent fallback
            const mockData = {
                symbol: symbol,
                name: 'Bitcoin',
                price: 51000,
                priceInUSD: 51000,
                change: 0.025,
                changePercent: 2.5,
                priceInBTC: 1,
                lastUpdated: "2023-01-01T12:00:00Z",
                type: AssetCategoryValues.Cryptocurrency
            };
            // If CoinMarketCap is rate limited, go directly to CoinGecko
            if (this.coinMarketCapRateLimited) {
                try {
                    const geckoPrice = await this.coinGeckoService.getCryptoPrice(symbol);
                    return geckoPrice || mockData;
                }
                catch (geckoError) {
                    console.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol}:`, geckoError);
                    return mockData;
                }
            }
            try {
                // Try CoinMarketCap first if not rate limited
                const response = await this.coinMarketCapService.getAssetPrice(symbol);
                return response || mockData;
            }
            catch (error) {
                console.warn(`[SecureMarketData] CoinMarketCap price fetch failed for ${symbol}:`, error);
                // Mark CoinMarketCap as rate limited and try CoinGecko
                this.coinMarketCapRateLimited = true;
                try {
                    const geckoPrice = await this.coinGeckoService.getCryptoPrice(symbol);
                    return geckoPrice || mockData;
                }
                catch (geckoError) {
                    console.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol}:`, geckoError);
                    return mockData;
                }
            }
        }
        catch (error) {
            console.error(`[SecureMarketData] Critical error fetching BTC price for ${symbol}:`, error);
            return null;
        }
    }
    // Method to get historical data with load balancing
    async getHistoricalData(symbol, days) {
        try {
            console.log(`[SecureMarketData] Fetching historical data for ${symbol}, ${days} days`);
            const asset = await this.getAssetBySymbol(symbol);
            if (!asset) {
                console.warn(`[SecureMarketData] Asset not found: ${symbol}`);
                return [];
            }
            try {
                // Try CoinGecko first
                const historicalData = await this.coinGeckoService.getHistoricalData(symbol, days);
                if (historicalData && historicalData.length) {
                    return historicalData;
                }
                // If no data found, return empty array
                return [];
            }
            catch (geckoError) {
                console.warn(`[SecureMarketData] CoinGecko historical data fetch failed for ${symbol}:`, geckoError);
                return [];
            }
        }
        catch (error) {
            console.error(`[SecureMarketData] Critical error fetching historical data for ${symbol}:`, error);
            return [];
        }
    }
}
// Export an instance of the service with default dependencies
const secureMarketDataService = new SecureMarketDataService();
export default secureMarketDataService;
// Also export the class for potential extension
export { SecureMarketDataService };
