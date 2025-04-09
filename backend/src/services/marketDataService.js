const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const Asset = require('../models/assetModel');
const Watchlist = require('../models/watchlistModel');
const PriceAlert = require('../models/priceAlertModel');

class MarketDataService {
    constructor() {
        this.baseUrl = process.env.MARKET_DATA_API_URL;
        this.apiKey = process.env.MARKET_DATA_API_KEY;
    }

    async searchAssets(query) {
        const cacheKey = `asset_search:${query}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { query, apiKey: this.apiKey }
            });
            const assets = response.data.data;
            cache.set(cacheKey, assets, 300); // Cache for 5 minutes
            return assets;
        } catch (error) {
            logger.error('Asset Search API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to search assets', 500);
        }
    }

    async getPopularAssets() {
        const cacheKey = 'popular_assets';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/popular`, {
                params: { apiKey: this.apiKey }
            });
            const assets = response.data.data;
            cache.set(cacheKey, assets, 300); // Cache for 5 minutes
            return assets;
        } catch (error) {
            logger.error('Popular Assets API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch popular assets', 500);
        }
    }

    async getAssetPrice(symbol) {
        const cacheKey = `asset_price:${symbol}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/price/${symbol}`, {
                params: { apiKey: this.apiKey }
            });
            const price = response.data.data;
            cache.set(cacheKey, price, 60); // Cache for 1 minute
            return price;
        } catch (error) {
            logger.error('Asset Price API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch asset price', 500);
        }
    }

    async getHistoricalPrices(symbol, interval) {
        const cacheKey = `historical_prices:${symbol}:${interval}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/history/${symbol}`, {
                params: { interval, apiKey: this.apiKey }
            });
            const prices = response.data.data;
            cache.set(cacheKey, prices, 300); // Cache for 5 minutes
            return prices;
        } catch (error) {
            logger.error('Historical Prices API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch historical prices', 500);
        }
    }

    async getAssetStats(symbol) {
        const cacheKey = `asset_stats:${symbol}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/stats/${symbol}`, {
                params: { apiKey: this.apiKey }
            });
            const stats = response.data.data;
            cache.set(cacheKey, stats, 300); // Cache for 5 minutes
            return stats;
        } catch (error) {
            logger.error('Asset Stats API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch asset stats', 500);
        }
    }

    async getMarketOverview() {
        const cacheKey = 'market_overview';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/overview`, {
                params: { apiKey: this.apiKey }
            });
            const overview = response.data.data;
            cache.set(cacheKey, overview, 300); // Cache for 5 minutes
            return overview;
        } catch (error) {
            logger.error('Market Overview API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch market overview', 500);
        }
    }

    async getTrendingAssets() {
        const cacheKey = 'trending_assets';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/trending`, {
                params: { apiKey: this.apiKey }
            });
            const trending = response.data.data;
            cache.set(cacheKey, trending, 300); // Cache for 5 minutes
            return trending;
        } catch (error) {
            logger.error('Trending Assets API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch trending assets', 500);
        }
    }

    async addToWatchlist(userId, symbol) {
        try {
            let watchlist = await Watchlist.findOne({ userId, symbol });
            if (!watchlist) {
                watchlist = new Watchlist({
                    userId,
                    symbol,
                    addedAt: Date.now()
                });
                await watchlist.save();
            }
            return watchlist;
        } catch (error) {
            logger.error('Watchlist Add Error:', error);
            throw new AppError('Failed to add to watchlist', 500);
        }
    }

    async removeFromWatchlist(userId, symbol) {
        try {
            await Watchlist.deleteOne({ userId, symbol });
        } catch (error) {
            logger.error('Watchlist Remove Error:', error);
            throw new AppError('Failed to remove from watchlist', 500);
        }
    }

    async getWatchlist(userId) {
        try {
            const watchlist = await Watchlist.find({ userId })
                .sort({ addedAt: -1 });
            return watchlist;
        } catch (error) {
            logger.error('Watchlist Get Error:', error);
            throw new AppError('Failed to get watchlist', 500);
        }
    }

    async createPriceAlert(userId, symbol, price, condition) {
        try {
            const alert = new PriceAlert({
                userId,
                symbol,
                price,
                condition,
                createdAt: Date.now(),
                active: true
            });
            await alert.save();
            return alert;
        } catch (error) {
            logger.error('Price Alert Create Error:', error);
            throw new AppError('Failed to create price alert', 500);
        }
    }

    async getPriceAlerts(userId) {
        try {
            const alerts = await PriceAlert.find({ userId, active: true })
                .sort({ createdAt: -1 });
            return alerts;
        } catch (error) {
            logger.error('Price Alerts Get Error:', error);
            throw new AppError('Failed to get price alerts', 500);
        }
    }

    async deletePriceAlert(userId, alertId) {
        try {
            await PriceAlert.deleteOne({ _id: alertId, userId });
        } catch (error) {
            logger.error('Price Alert Delete Error:', error);
            throw new AppError('Failed to delete price alert', 500);
        }
    }
}

module.exports = new MarketDataService();
