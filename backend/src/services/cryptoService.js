const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const Asset = require('../models/assetModel');
const Portfolio = require('../models/portfolioModel');
const Transaction = require('../models/transactionModel');

class CryptoService {
    constructor() {
        this.baseUrl = process.env.CRYPTO_API_URL;
        this.apiKey = process.env.CRYPTO_API_KEY;
    }

    async getCryptoList() {
        const cacheKey = 'crypto_list';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/list`, {
                params: { apiKey: this.apiKey }
            });
            const cryptos = response.data.data;
            cache.set(cacheKey, cryptos, 300); // Cache for 5 minutes
            return cryptos;
        } catch (error) {
            logger.error('Crypto List API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch crypto list', 500);
        }
    }

    async getCryptoPrice(symbol) {
        const cacheKey = `crypto_price:${symbol}`;
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
            logger.error('Crypto Price API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch crypto price', 500);
        }
    }

    async getCryptoHistory(symbol, interval) {
        const cacheKey = `crypto_history:${symbol}:${interval}`;
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
            logger.error('Crypto History API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch crypto history', 500);
        }
    }

    async getMarketCap() {
        const cacheKey = 'crypto_market_cap';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/market-cap`, {
                params: { apiKey: this.apiKey }
            });
            const marketCap = response.data.data;
            cache.set(cacheKey, marketCap, 300); // Cache for 5 minutes
            return marketCap;
        } catch (error) {
            logger.error('Market Cap API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch market cap data', 500);
        }
    }

    async getVolume() {
        const cacheKey = 'crypto_volume';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return cachedData;

        try {
            const response = await axios.get(`${this.baseUrl}/volume`, {
                params: { apiKey: this.apiKey }
            });
            const volume = response.data.data;
            cache.set(cacheKey, volume, 300); // Cache for 5 minutes
            return volume;
        } catch (error) {
            logger.error('Volume API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch volume data', 500);
        }
    }

    async getTrending() {
        const cacheKey = 'crypto_trending';
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
            logger.error('Trending API Error:', error.response ? error.response.data : error.message);
            throw new AppError('Failed to fetch trending data', 500);
        }
    }

    async addToPortfolio(userId, symbol, amount, price) {
        try {
            let portfolio = await Portfolio.findOne({ userId, symbol });
            if (portfolio) {
                portfolio.amount += amount;
                portfolio.averagePrice = ((portfolio.amount - amount) * portfolio.averagePrice + amount * price) / portfolio.amount;
            } else {
                portfolio = new Portfolio({
                    userId,
                    symbol,
                    amount,
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

    async recordTransaction(userId, symbol, type, amount, price) {
        try {
            const transaction = new Transaction({
                userId,
                symbol,
                type,
                amount,
                price,
                timestamp: Date.now()
            });
            await transaction.save();
            return transaction;
        } catch (error) {
            logger.error('Transaction Record Error:', error);
            throw new AppError('Failed to record transaction', 500);
        }
    }

    async getTransactions(userId) {
        try {
            const transactions = await Transaction.find({ userId })
                .sort({ timestamp: -1 });
            return transactions;
        } catch (error) {
            logger.error('Transactions Get Error:', error);
            throw new AppError('Failed to get transactions', 500);
        }
    }

    async getPortfolioPerformance(userId, timeframe) {
        try {
            const portfolio = await Portfolio.find({ userId });
            const performance = await Promise.all(
                portfolio.map(async (holding) => {
                    const history = await this.getCryptoHistory(holding.symbol, timeframe);
                    return {
                        symbol: holding.symbol,
                        amount: holding.amount,
                        averagePrice: holding.averagePrice,
                        currentPrice: history[history.length - 1].price,
                        performance: history.map(point => ({
                            timestamp: point.timestamp,
                            value: point.price * holding.amount
                        }))
                    };
                })
            );
            return performance;
        } catch (error) {
            logger.error('Portfolio Performance Error:', error);
            throw new AppError('Failed to get portfolio performance', 500);
        }
    }
}

module.exports = new CryptoService();