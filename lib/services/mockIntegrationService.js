/**
 * Mock Integration Service
 *
 * This service provides mock data and integration points for testing in both Vercel and Strapi environments.
 * It's designed to be a drop-in replacement for real API services when testing or when APIs are unavailable.
 */
class MockIntegrationService {
    constructor(environment) {
        // Auto-detect environment if not specified
        if (!environment) {
            if (typeof process !== 'undefined' && process.env) {
                if (process.env.VERCEL) {
                    this.environment = 'vercel';
                }
                else if (process.env.STRAPI_ADMIN) {
                    this.environment = 'strapi';
                }
                else {
                    this.environment = 'development';
                }
            }
            else {
                this.environment = 'development';
            }
        }
        else {
            this.environment = environment;
        }
        console.log(`MockIntegrationService initialized in ${this.environment} environment`);
    }
    /**
     * Get the current environment
     */
    getEnvironment() {
        return this.environment;
    }
    /**
     * Get mock crypto data
     */
    async getMockCryptoData(symbol = 'BTC') {
        // Generate slightly different data based on environment for testing
        const basePrice = symbol === 'BTC' ? 50000 : 3000;
        const priceVariation = this.environment === 'vercel' ? 1.05 : (this.environment === 'strapi' ? 0.95 : 1);
        return {
            symbol,
            price: basePrice * priceVariation,
            change: basePrice * 0.02 * (Math.random() > 0.5 ? 1 : -1),
            changePercent: 2.5 * (Math.random() > 0.5 ? 1 : -1),
            priceInBTC: symbol === 'BTC' ? 1 : basePrice / 50000,
            priceInUSD: basePrice * priceVariation,
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Get mock historical data
     */
    async getMockHistoricalData(symbol, days = 30) {
        const result = [];
        const today = new Date();
        // Base values for different symbols
        let baseValue = symbol.toUpperCase() === 'BTC' ? 50000 : 3000;
        // Add environment-specific variation
        if (this.environment === 'vercel') {
            baseValue *= 1.05; // 5% higher on Vercel
        }
        else if (this.environment === 'strapi') {
            baseValue *= 0.95; // 5% lower on Strapi
        }
        // Generate data points for each day
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            // Add some random variation
            const randomFactor = 0.02; // 2% max variation
            const dailyVariation = baseValue * randomFactor * (Math.random() * 2 - 1);
            const price = baseValue + dailyVariation;
            // Update base value for next day
            baseValue = price;
            // Generate more realistic data with open, high, low, close, and volume
            const open = price * (1 - 0.005 + Math.random() * 0.01);
            const high = price * (1 + 0.005 + Math.random() * 0.01);
            const low = price * (1 - 0.005 - Math.random() * 0.01);
            const close = price;
            const volume = symbol.toUpperCase() === 'BTC' ?
                1000000000 + Math.random() * 500000000 :
                1000000 + Math.random() * 500000;
            result.push({
                timestamp: date.getTime(),
                value: close,
                date: new Date(date),
                price: parseFloat(price.toFixed(2)),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: Math.round(volume)
            });
        }
        return result;
    }
    /**
     * Get mock asset list
     */
    async getMockAssetList(assetType, page = 1, pageSize = 20) {
        let assets = [];
        switch (assetType) {
            case 'crypto':
                assets = [
                    { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', price: 65000, change: 1500, changePercent: 2.3 },
                    { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', price: 3500, change: 120, changePercent: 1.5 },
                    { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', price: 500, change: 10, changePercent: 2.0 },
                    { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', price: 150, change: 3, changePercent: 2.1 },
                    { symbol: 'XRP', name: 'Ripple', type: 'Cryptocurrency', price: 1.2, change: 0.02, changePercent: 1.7 },
                    { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', price: 2.5, change: 0.05, changePercent: 2.0 },
                    { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', price: 0.15, change: 0.01, changePercent: 1.8 },
                    { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', price: 20, change: 0.4, changePercent: 2.0 },
                    { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', price: 35, change: 0.7, changePercent: 2.0 },
                    { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', price: 1.5, change: 0.03, changePercent: 2.0 }
                ];
                break;
            case 'stock':
                assets = [
                    { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks', price: 175, change: 2, changePercent: 1.2 },
                    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', price: 350, change: 4, changePercent: 1.1 },
                    { symbol: 'GOOGL', name: 'Alphabet Inc', type: 'Stocks', price: 2800, change: 30, changePercent: 1.1 },
                    { symbol: 'AMZN', name: 'Amazon.com Inc', type: 'Stocks', price: 3500, change: 40, changePercent: 1.2 },
                    { symbol: 'TSLA', name: 'Tesla Inc', type: 'Stocks', price: 250, change: 5, changePercent: 2.0 },
                    { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stocks', price: 480, change: 8, changePercent: 1.7 },
                    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', price: 880, change: 20, changePercent: 2.3 },
                    { symbol: 'JPM', name: 'JPMorgan Chase & Co', type: 'Stocks', price: 180, change: 2, changePercent: 1.1 },
                    { symbol: 'V', name: 'Visa Inc', type: 'Stocks', price: 270, change: 3, changePercent: 1.2 },
                    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', price: 155, change: 1, changePercent: 0.7 }
                ];
                break;
            case 'commodity':
                assets = [
                    { symbol: 'GC', name: 'Gold', type: 'Commodities', price: 2000, change: 10, changePercent: 0.5 },
                    { symbol: 'SI', name: 'Silver', type: 'Commodities', price: 25, change: 0.1, changePercent: 0.4 },
                    { symbol: 'PL', name: 'Platinum', type: 'Commodities', price: 950, change: 5, changePercent: 0.6 },
                    { symbol: 'PA', name: 'Palladium', type: 'Commodities', price: 1200, change: 8, changePercent: 0.7 },
                    { symbol: 'HG', name: 'Copper', type: 'Commodities', price: 4.5, change: 0.02, changePercent: 0.4 },
                    { symbol: 'CL', name: 'Crude Oil', type: 'Commodities', price: 85, change: 1, changePercent: 1.2 },
                    { symbol: 'NG', name: 'Natural Gas', type: 'Commodities', price: 3.5, change: 0.05, changePercent: 1.4 },
                    { symbol: 'ZC', name: 'Corn', type: 'Commodities', price: 600, change: 5, changePercent: 0.8 },
                    { symbol: 'ZW', name: 'Wheat', type: 'Commodities', price: 700, change: 6, changePercent: 0.9 },
                    { symbol: 'ZS', name: 'Soybeans', type: 'Commodities', price: 1400, change: 8, changePercent: 0.6 }
                ];
                break;
            case 'index':
                assets = [
                    { symbol: 'SPX', name: 'S&P 500', type: 'Indices', price: 4200, change: 30, changePercent: 0.7 },
                    { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', price: 34000, change: 200, changePercent: 0.6 },
                    { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', price: 14000, change: 120, changePercent: 0.9 },
                    { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', price: 2000, change: 15, changePercent: 0.75 },
                    { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', price: 7500, change: 50, changePercent: 0.67 },
                    { symbol: 'DAX', name: 'DAX', type: 'Indices', price: 16000, change: 100, changePercent: 0.63 },
                    { symbol: 'CAC', name: 'CAC 40', type: 'Indices', price: 7000, change: 60, changePercent: 0.86 },
                    { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', price: 30000, change: 200, changePercent: 0.7 },
                    { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', price: 25000, change: 180, changePercent: 0.72 },
                    { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', price: 3500, change: 25, changePercent: 0.71 }
                ];
                break;
        }
        // Add environment-specific marker to asset names for testing
        assets = assets.map(asset => ({
            ...asset,
            name: `${asset.name} [${this.environment}]`
        }));
        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, assets.length);
        const paginatedAssets = assets.slice(start, end);
        return {
            data: paginatedAssets,
            pagination: {
                page,
                pageSize,
                totalItems: assets.length,
                totalPages: Math.ceil(assets.length / pageSize)
            }
        };
    }
    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        switch (this.environment) {
            case 'vercel':
                return {
                    apiBaseUrl: 'https://trend2zero.vercel.app/api',
                    strapiBaseUrl: process.env.STRAPI_API_URL || 'https://trend2zero-strapi.vercel.app',
                    cacheEnabled: true,
                    cacheDuration: 3600, // 1 hour
                    mockDataEnabled: true
                };
            case 'strapi':
                return {
                    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
                    strapiBaseUrl: 'http://localhost:1337',
                    cacheEnabled: true,
                    cacheDuration: 300, // 5 minutes
                    mockDataEnabled: true
                };
            default:
                return {
                    apiBaseUrl: 'http://localhost:3000/api',
                    strapiBaseUrl: 'http://localhost:1337',
                    cacheEnabled: false,
                    cacheDuration: 60, // 1 minute
                    mockDataEnabled: true
                };
        }
    }
    /**
     * Test connection to external services
     */
    async testConnections() {
        const results = {
            environment: this.environment,
            timestamp: new Date().toISOString(),
            services: {}
        };
        // Test Vercel API connection
        try {
            const vercelApiUrl = this.getEnvironmentConfig().apiBaseUrl + '/health';
            results.services.vercelApi = {
                status: 'mocked',
                url: vercelApiUrl,
                message: `Mock connection to Vercel API in ${this.environment} environment`
            };
        }
        catch (error) {
            results.services.vercelApi = {
                status: 'error',
                message: error.message
            };
        }
        // Test Strapi API connection
        try {
            const strapiApiUrl = this.getEnvironmentConfig().strapiBaseUrl + '/api/assets';
            results.services.strapiApi = {
                status: 'mocked',
                url: strapiApiUrl,
                message: `Mock connection to Strapi API in ${this.environment} environment`
            };
        }
        catch (error) {
            results.services.strapiApi = {
                status: 'error',
                message: error.message
            };
        }
        // Test database connection
        try {
            results.services.database = {
                status: 'mocked',
                type: this.environment === 'strapi' ? 'SQLite' : 'MongoDB',
                message: `Mock connection to database in ${this.environment} environment`
            };
        }
        catch (error) {
            results.services.database = {
                status: 'error',
                message: error.message
            };
        }
        return results;
    }
}

module.exports = MockIntegrationService;
