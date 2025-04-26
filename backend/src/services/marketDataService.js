const cache = require('../utils/cache');
const logger = require('../utils/logger');
const { CoinGeckoService } = require('./coinGeckoService');
const { MetalPriceService } = require('./metalPriceService');
const { AlphaVantageService } = require('./alphaVantageService');

const coinGeckoService = new CoinGeckoService();
const metalPriceService = new MetalPriceService();
const alphaVantageService = new AlphaVantageService();

async function getAssetPrice(symbol, type = 'crypto') {
    const cacheKey = `price-${symbol}-${type}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let price;
    switch(type) {
        case 'crypto':
            price = await coinGeckoService.getPrice(symbol);
            break;
        case 'metal':
            price = await metalPriceService.getPrice(symbol);
            break;
        case 'stock':
            price = await alphaVantageService.getPrice(symbol);
            break;
        default:
            throw new Error('Unsupported asset type');
    }

    cache.set(cacheKey, price, 300); // Cache for 5 minutes
    return price;
}

async function getHistoricalData(symbol, type = 'crypto', interval = '1d') {
    const cacheKey = `history-${symbol}-${type}-${interval}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let data;
    switch(type) {
        case 'crypto':
            data = await coinGeckoService.getHistoricalData(symbol, interval);
            break;
        case 'metal':
            data = await metalPriceService.getHistoricalData(symbol, interval);
            break;
        case 'stock':
            data = await alphaVantageService.getHistoricalData(symbol, interval);
            break;
        default:
            throw new Error('Unsupported asset type');
    }

    cache.set(cacheKey, data, 3600); // Cache for 1 hour
    return data;
}

async function searchAssets(query, type) {
    const results = [];
    
    if (!type || type === 'crypto') {
        const cryptoResults = await coinGeckoService.searchAssets(query);
        results.push(...cryptoResults);
    }

    if (!type || type === 'stock') {
        const stockResults = await alphaVantageService.searchStocks(query);
        results.push(...stockResults);
    }

    if (!type || type === 'metal') {
        const metalResults = await metalPriceService.searchAssets(query);
        results.push(...metalResults);
    }

    return results;
}

async function getMarketOverview() {
    const [cryptoOverview, stockOverview, metalOverview] = await Promise.all([
        coinGeckoService.getMarketOverview(),
        alphaVantageService.getMarketOverview(),
        metalPriceService.getMarketOverview()
    ]);

    return {
        crypto: cryptoOverview,
        stocks: stockOverview,
        metals: metalOverview
    };
}

async function getTrendingAssets() {
    const [trendingCrypto, trendingStocks] = await Promise.all([
        coinGeckoService.getTrendingAssets(),
        alphaVantageService.getTrendingStocks()
    ]);

    return [...trendingCrypto, ...trendingStocks];
}

async function getPopularAssets() {
    const [popularCrypto, popularStocks] = await Promise.all([
        coinGeckoService.getPopularAssets(),
        alphaVantageService.getPopularStocks()
    ]);

    return [...popularCrypto, ...popularStocks];
}

module.exports = {
    getAssetPrice,
    getHistoricalData,
    searchAssets,
    getMarketOverview,
    getTrendingAssets,
    getPopularAssets
};
