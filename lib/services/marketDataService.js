import { CoinGeckoService } from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService'; // Fixed import to use the default export
import { SecureMarketDataService } from './secureMarketDataService';
/**
 * Market Data Service
 *
 * This service provides a unified interface for accessing market data
 * from various sources. It uses the SecureMarketDataService to ensure
 * that API keys are not exposed to the client.
 */
export class MarketDataService {
    constructor() {
        console.log(`[MarketDataService] Initializing service`);
        this.coinGeckoService = new CoinGeckoService();
        // Using the imported coinMarketCapService singleton instance instead of creating a new one
        this.secureService = new SecureMarketDataService();
        this.useMockData = process.env.USE_MOCK_DATA === 'true';
    }
    async listAvailableAssets(options = {}) {
        if (this.useMockData) {
            return this.getMockAssets(options.category, options.limit);
        }
        try {
            // Default to CoinGecko for initial implementation
            const assetList = await this.coinGeckoService.getTopAssets(options.limit || 100);
            if (options.searchQuery) {
                return assetList.filter(asset => asset.name.toLowerCase().includes(options.searchQuery.toLowerCase()) ||
                    asset.symbol.toLowerCase().includes(options.searchQuery.toLowerCase()));
            }
            if (options.category) {
                return assetList.filter(asset => asset.type === options.category);
            }
            if (options.sortBy) {
                return assetList.sort((a, b) => {
                    const aValue = a[options.sortBy];
                    const bValue = b[options.sortBy];
                    return options.sortOrder === 'desc'
                        ? (bValue > aValue ? 1 : -1)
                        : (aValue > bValue ? 1 : -1);
                });
            }
            return assetList;
        }
        catch (error) {
            console.error('[MarketDataService] Error fetching assets:', error);
            return []; // Return empty array instead of throwing to maintain API stability
        }
    }
    async getAssetPrice(symbol) {
        if (this.useMockData) {
            return this.getMockAssets(undefined, 1).find(a => a.symbol === symbol) || null;
        }
        try {
            // Try CoinGecko first
            const price = await this.coinGeckoService.getCryptoPrice(symbol);
            if (price)
                return price;
            // Fallback to CoinMarketCap
            return await coinMarketCapService.getAssetPrice(symbol);
        }
        catch (error) {
            console.error(`[MarketDataService] Error fetching price for ${symbol}:`, error);
            return null;
        }
    }
    async getHistoricalData(symbol, days = 7) {
        if (this.useMockData) {
            // Generate mock historical data
            const result = [];
            const today = new Date();
            let basePrice = 100;
            if (symbol === 'BTC')
                basePrice = 60000;
            else if (symbol === 'ETH')
                basePrice = 3000;
            else if (symbol === 'AAPL')
                basePrice = 180;
            else if (symbol === 'GOOGL')
                basePrice = 125;
            else if (symbol === 'XAU')
                basePrice = 2000;
            for (let i = days; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const randomFactor = 0.98 + Math.random() * 0.04;
                const price = basePrice * randomFactor;
                result.push({
                    timestamp: date.getTime(),
                    value: price,
                    date,
                    price,
                    open: price * 0.99,
                    high: price * 1.01,
                    low: price * 0.98,
                    close: price,
                    volume: Math.floor(Math.random() * 1000000)
                });
                basePrice = price;
            }
            return result;
        }
        try {
            return await this.coinGeckoService.getHistoricalData(symbol, days);
        }
        catch (error) {
            console.error(`[MarketDataService] Error fetching historical data for ${symbol}:`, error);
            return [];
        }
    }
    
    /**
     * Get market overview data including top performing assets
     */
    async getMarketOverview() {
        if (this.useMockData) {
            return {
                topGainers: this.getMockAssets().sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
                topLosers: this.getMockAssets().sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
                trending: this.getMockAssets().slice(0, 5),
                marketCap: 2300000000000,
                volume24h: 98000000000,
                btcDominance: 44.5,
                lastUpdated: new Date().toISOString()
            };
        }
        
        try {
            // Get top assets
            const assets = await this.listAvailableAssets({ limit: 100 });
            
            // Calculate market overview metrics
            const topGainers = [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
            const topLosers = [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
            const trending = assets.slice(0, 5); // Just use the top assets as trending for now
            
            return {
                topGainers,
                topLosers,
                trending,
                marketCap: 0, // These would need to be calculated from actual API data
                volume24h: 0,
                btcDominance: 0,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('[MarketDataService] Error fetching market overview:', error);
            // Return mock data as fallback in case of error
            return {
                topGainers: this.getMockAssets().sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
                topLosers: this.getMockAssets().sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
                trending: this.getMockAssets().slice(0, 5),
                marketCap: 2300000000000,
                volume24h: 98000000000,
                btcDominance: 44.5,
                lastUpdated: new Date().toISOString()
            };
        }
    }
    
    /**
     * Determine if an asset is a cryptocurrency based on its symbol
     */
    isCryptoCurrency(symbol) {
        // Fallback: treat as crypto if symbol matches common crypto symbols
        const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC"];
        return cryptoSymbols.includes(symbol.toUpperCase());
    }
    /**
     * Get mock assets when API calls are not available
     */
    getMockAssets(category, limit = 20) {
        const mockAssets = [
            {
                symbol: 'BTC',
                name: 'Bitcoin',
                type: 'Cryptocurrency',
                price: 65000,
                changePercent: 2.3,
                priceInUSD: 65000,
                priceInBTC: 1,
                change: 1500,
                lastUpdated: new Date().toISOString()
            },
            {
                symbol: 'ETH',
                name: 'Ethereum',
                type: 'Cryptocurrency',
                price: 3500,
                changePercent: 1.5,
                priceInUSD: 3500,
                priceInBTC: 0.05,
                change: 120,
                lastUpdated: new Date().toISOString()
            },
            {
                symbol: 'AAPL',
                name: 'Apple Inc',
                type: 'Stocks',
                price: 175,
                changePercent: 1.2,
                priceInUSD: 175,
                priceInBTC: 0.003,
                change: 2.5,
                lastUpdated: new Date().toISOString()
            },
            {
                symbol: 'GOOGL',
                name: 'Alphabet Inc',
                type: 'Stocks',
                price: 140,
                changePercent: 1.0,
                priceInUSD: 140,
                priceInBTC: 0.002,
                change: 1.8,
                lastUpdated: new Date().toISOString()
            },
            {
                symbol: 'XAU',
                name: 'Gold',
                type: 'Precious Metal',
                price: 2000,
                changePercent: -0.2,
                priceInUSD: 2000,
                priceInBTC: 0.03,
                change: -5,
                lastUpdated: new Date().toISOString()
            },
            {
                symbol: 'XAG',
                name: 'Silver',
                type: 'Precious Metal',
                price: 25,
                changePercent: -0.1,
                priceInUSD: 25,
                priceInBTC: 0.0004,
                change: -0.2,
                lastUpdated: new Date().toISOString()
            }
        ];
        const filteredAssets = category
            ? mockAssets.filter(asset => asset.type === category)
            : mockAssets;
        return filteredAssets.slice(0, limit);
    }
}
// Create a singleton instance and export as default
const marketDataService = new MarketDataService();
export default marketDataService;

/**
 * Fetch popular assets with optional limit and category
 * @param {{ limit?: number; category?: import('../types').AssetCategory }} options
 */
export function getPopularAssets(options) {
    return marketDataService.listAvailableAssets(options);
}

/**
 * Search assets by query and optional limit
 * @param {string} query
 * @param {number} [limit]
 */
export function searchAssets(query, limit) {
    return marketDataService.listAvailableAssets({ searchQuery: query, limit });
}

/**
 * Get price for a specific asset symbol
 * @param {string} symbol
 */
export function getAssetPrice(symbol) {
    return marketDataService.getAssetPrice(symbol);
}

/**
 * Get historical data for a specific asset symbol
 * @param {string} symbol
 * @param {number} [days]
 */
export function getHistoricalData(symbol, days) {
    return marketDataService.getHistoricalData(symbol, days);
}
