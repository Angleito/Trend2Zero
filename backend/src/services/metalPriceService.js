const axios = require('axios');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const cache = require('../utils/cache');

class MetalPriceService {
    constructor(apiKey = process.env.METAL_PRICE_API_KEY) {
        this.apiKey = apiKey;
        this.baseURL = 'https://metals-api.com/api';
        this.cacheTimeout = 300; // 5 minutes
    }

    /**
     * Get metal price by symbol
     * @param {string} symbol - Metal symbol (e.g., XAU, XAG)
     * @returns {Promise<Object>} Metal price data
     */
    async getMetalBySymbol(symbol) {
        try {
            const cacheKey = `metal_price_${symbol}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/latest`, {
                params: {
                    access_key: this.apiKey,
                    base: 'USD',
                    symbols: symbol
                }
            });

            if (!response.data.success) {
                throw new AppError(`Failed to fetch metal price: ${response.data.error.message}`, 500);
            }

            const metalData = {
                symbol,
                price: 1 / response.data.rates[symbol], // Convert from USD/Metal to Metal/USD
                timestamp: response.data.timestamp,
                unit: 'troy ounce'
            };

            cache.set(cacheKey, metalData, this.cacheTimeout);
            return metalData;
        } catch (error) {
            logger.error('Metal Price API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch price for metal: ${symbol}`, 500);
        }
    }

    /**
     * Get historical metal price data
     * @param {string} symbol - Metal symbol
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Historical price data
     */
    async getHistoricalData(symbol, startDate, endDate) {
        try {
            const cacheKey = `metal_historical_${symbol}_${startDate}_${endDate}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/timeframe`, {
                params: {
                    access_key: this.apiKey,
                    base: 'USD',
                    symbols: symbol,
                    start_date: startDate,
                    end_date: endDate
                }
            });

            if (!response.data.success) {
                throw new AppError(`Failed to fetch historical data: ${response.data.error.message}`, 500);
            }

            const historicalData = Object.entries(response.data.rates).map(([date, rates]) => ({
                date,
                price: 1 / rates[symbol], // Convert from USD/Metal to Metal/USD
                unit: 'troy ounce'
            }));

            cache.set(cacheKey, historicalData, this.cacheTimeout);
            return historicalData;
        } catch (error) {
            logger.error('Metal Price Historical API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch historical data for metal: ${symbol}`, 500);
        }
    }

    /**
     * Get supported metals list
     * @returns {Promise<Array>} List of supported metals
     */
    async getSupportedMetals() {
        try {
            const cacheKey = 'supported_metals';
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/symbols`, {
                params: {
                    access_key: this.apiKey
                }
            });

            if (!response.data.success) {
                throw new AppError(`Failed to fetch supported metals: ${response.data.error.message}`, 500);
            }

            const metals = Object.entries(response.data.symbols).map(([symbol, name]) => ({
                symbol,
                name,
                type: 'metal'
            }));

            cache.set(cacheKey, metals, this.cacheTimeout);
            return metals;
        } catch (error) {
            logger.error('Metal Price Symbols API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch supported metals list', 500);
        }
    }
}

module.exports = MetalPriceService;
