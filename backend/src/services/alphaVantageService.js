const axios = require('axios');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const cache = require('../utils/cache');

class AlphaVantageService {
    constructor(apiKey = process.env.ALPHA_VANTAGE_API_KEY) {
        this.apiKey = apiKey;
        this.baseURL = 'https://www.alphavantage.co/query';
        this.cacheTimeout = 300; // 5 minutes
    }

    /**
     * Search for stocks by keywords
     * @param {string} keywords - Search keywords
     * @returns {Promise<Array>} Array of matching stocks
     */
    async searchStocks(keywords) {
        try {
            const cacheKey = `stock_search_${keywords}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(this.baseURL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords,
                    apikey: this.apiKey
                }
            });

            if (!response.data.bestMatches) {
                throw new AppError('Invalid response from Alpha Vantage API', 500);
            }

            const stocks = response.data.bestMatches.map(match => ({
                symbol: match['1. symbol'],
                name: match['2. name'],
                type: match['3. type'],
                region: match['4. region'],
                currency: match['8. currency']
            }));

            cache.set(cacheKey, stocks, this.cacheTimeout);
            return stocks;
        } catch (error) {
            logger.error('Alpha Vantage Search Error:', error.message);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to search stocks', 500);
        }
    }

    /**
     * Get real-time quote for a stock
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} Stock quote data
     */
    async getStockQuote(symbol) {
        try {
            const cacheKey = `stock_quote_${symbol}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(this.baseURL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol,
                    apikey: this.apiKey
                }
            });

            const quote = response.data['Global Quote'];
            if (!quote || !quote['01. symbol']) {
                throw new AppError('Invalid quote response from Alpha Vantage API', 500);
            }

            const quoteData = {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                volume: parseInt(quote['06. volume']),
                latestTradingDay: quote['07. latest trading day'],
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'])
            };

            cache.set(cacheKey, quoteData, this.cacheTimeout);
            return quoteData;
        } catch (error) {
            logger.error('Alpha Vantage Quote Error:', error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch quote for stock: ${symbol}`, 500);
        }
    }

    /**
     * Get historical data for a stock
     * @param {string} symbol - Stock symbol
     * @param {string} [outputsize='compact'] - Data size (compact/full)
     * @returns {Promise<Array>} Historical price data
     */
    async getHistoricalData(symbol, outputsize = 'compact') {
        try {
            const cacheKey = `stock_historical_${symbol}_${outputsize}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(this.baseURL, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol,
                    outputsize,
                    apikey: this.apiKey
                }
            });

            const timeSeriesKey = 'Time Series (Daily)';
            const data = response.data;
            
            if (!data[timeSeriesKey] || Object.keys(data[timeSeriesKey]).length === 0) {
                throw new AppError('Invalid historical data response from Alpha Vantage API', 500);
            }

            const historicalData = Object.entries(data[timeSeriesKey]).map(([date, values]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            }));

            cache.set(cacheKey, historicalData, this.cacheTimeout);
            return historicalData;
        } catch (error) {
            logger.error('Alpha Vantage Historical Data Error:', error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch historical data for stock: ${symbol}`, 500);
        }
    }
}

module.exports = AlphaVantageService;
