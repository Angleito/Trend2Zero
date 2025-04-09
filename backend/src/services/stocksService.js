const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const Portfolio = require('../models/portfolioModel');
const Order = require('../models/orderModel');

class StocksService {
    constructor() {
        this.baseUrl = process.env.STOCKS_API_URL;
        this.apiKey = process.env.STOCKS_API_KEY;
    }

    async searchStocks(query) {
        const cacheKey = `stocks_search:${query}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/search`, {
                params: { query, apiKey: this.apiKey }
            });
            const stocks = response.data.data;
            cache.set(cacheKey, stocks, 300); // Cache for 5 minutes
            return stocks;
        } catch (error) {
            logger.error('Stocks Search API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to search stocks', 500);
        }
    }

    async getQuote(symbol) {
        const cacheKey = `stock_quote:${symbol}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/quote/${symbol}`, {
                params: { apiKey: this.apiKey }
            });
            const quote = response.data.data;
            cache.set(cacheKey, quote, 60); // Cache for 1 minute
            return quote;
        } catch (error) {
            logger.error('Stock Quote API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch stock quote', 500);
        }
    }

    async getStockHistory(symbol, interval) {
        const cacheKey = `stock_history:${symbol}:${interval}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/history/${symbol}`, {
                params: { interval, apiKey: this.apiKey }
            });
            const history = response.data.data;
            cache.set(cacheKey, history, 300); // Cache for 5 minutes
            return history;
        } catch (error) {
            logger.error('Stock History API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch stock history', 500);
        }
    }

    async getMarketIndices() {
        const cacheKey = 'market_indices';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/indices`, {
                params: { apiKey: this.apiKey }
            });
            const indices = response.data.data;
            cache.set(cacheKey, indices, 60); // Cache for 1 minute
            return indices;
        } catch (error) {
            logger.error('Market Indices API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch market indices', 500);
        }
    }

    async getSectorPerformance() {
        const cacheKey = 'sector_performance';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/sectors`, {
                params: { apiKey: this.apiKey }
            });
            const sectors = response.data.data;
            cache.set(cacheKey, sectors, 300); // Cache for 5 minutes
            return sectors;
        } catch (error) {
            logger.error('Sector Performance API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch sector performance', 500);
        }
    }

    async getTopGainers() {
        const cacheKey = 'top_gainers';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/gainers`, {
                params: { apiKey: this.apiKey }
            });
            const gainers = response.data.data;
            cache.set(cacheKey, gainers, 300); // Cache for 5 minutes
            return gainers;
        } catch (error) {
            logger.error('Top Gainers API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch top gainers', 500);
        }
    }

    async getTopLosers() {
        const cacheKey = 'top_losers';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/losers`, {
                params: { apiKey: this.apiKey }
            });
            const losers = response.data.data;
            cache.set(cacheKey, losers, 300); // Cache for 5 minutes
            return losers;
        } catch (error) {
            logger.error('Top Losers API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch top losers', 500);
        }
    }

    async addToPortfolio(userId, symbol, shares, price) {
        try {
            let portfolio = await Portfolio.findOne({ userId, symbol });
            if (portfolio) {
                portfolio.shares += shares;
                portfolio.averagePrice = ((portfolio.shares - shares) * portfolio.averagePrice + shares * price) / portfolio.shares;
            } else {
                portfolio = new Portfolio({
                    userId,
                    symbol,
                    shares,
                    averagePrice: price
                });
            }
            await portfolio.save();
            return portfolio;
        } catch (error) {
            logger.error('Portfolio Add Error:', error);
            throw new AppError('Failed to add to portfolio', 500);
        }
    }

    async getPortfolio(userId) {
        try {
            const portfolio = await Portfolio.find({ userId });
            return portfolio;
        } catch (error) {
            logger.error('Portfolio Get Error:', error);
            throw new AppError('Failed to get portfolio', 500);
        }
    }

    async removeFromPortfolio(userId, symbol) {
        try {
            await Portfolio.deleteOne({ userId, symbol });
        } catch (error) {
            logger.error('Portfolio Remove Error:', error);
            throw new AppError('Failed to remove from portfolio', 500);
        }
    }

    async placeOrder(userId, symbol, type, shares, price) {
        try {
            const order = new Order({
                userId,
                symbol,
                type,
                shares,
                price,
                status: 'pending',
                timestamp: Date.now()
            });
            await order.save();
            return order;
        } catch (error) {
            logger.error('Order Place Error:', error);
            throw new AppError('Failed to place order', 500);
        }
    }

    async getOrders(userId) {
        try {
            const orders = await Order.find({ userId })
                .sort({ timestamp: -1 });
            return orders;
        } catch (error) {
            logger.error('Orders Get Error:', error);
            throw new AppError('Failed to get orders', 500);
        }
    }

    async getPositions(userId) {
        try {
            const portfolio = await Portfolio.find({ userId });
            const positions = await Promise.all(
                portfolio.map(async (holding) => {
                    const quote = await this.getQuote(holding.symbol);
                    return {
                        symbol: holding.symbol,
                        shares: holding.shares,
                        averagePrice: holding.averagePrice,
                        currentPrice: quote.price,
                        marketValue: quote.price * holding.shares,
                        unrealizedPL: (quote.price - holding.averagePrice) * holding.shares
                    };
                })
            );
            return positions;
        } catch (error) {
            logger.error('Positions Get Error:', error);
            throw new AppError('Failed to get positions', 500);
        }
    }
}

module.exports = new StocksService();