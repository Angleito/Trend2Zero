const axios = require('axios');
const cache = require('../utils/cache');

class MetalPriceService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.METAL_PRICE_API_KEY;
    this.baseURL = 'https://metals-api.com/api';
  }

  async getMetalBySymbol(symbol) {
    const cacheKey = `metal_price_${symbol}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await axios.get(`${this.baseURL}/latest`, {
        params: {
          access_key: this.apiKey,
          base: 'USD',
          symbols: symbol
        }
      });

      if (!response.data.success) {
        throw new Error(`Failed to fetch metal price: ${response.data.error.message}`);
      }

      const result = {
        symbol,
        price: 1 / response.data.rates[symbol],
        timestamp: response.data.timestamp,
        unit: 'troy ounce'
      };

      await cache.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch metal price:')) {
        throw error;
      }
      throw new Error(`Failed to fetch price for metal: ${symbol}`);
    }
  }

  async getHistoricalData(symbol, startDate, endDate) {
    const cacheKey = `metal_historical_${symbol}_${startDate}_${endDate}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
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
        throw new Error(`Failed to fetch historical data: ${response.data.error.message}`);
      }

      const result = Object.entries(response.data.rates).map(([date, rates]) => ({
        date,
        price: 1 / rates[symbol],
        unit: 'troy ounce'
      }));

      await cache.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch historical data:')) {
        throw error;
      }
      throw new Error(`Failed to fetch historical data for metal: ${symbol}`);
    }
  }

  async getSupportedMetals() {
    const cacheKey = 'supported_metals';
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await axios.get(`${this.baseURL}/symbols`, {
        params: {
          access_key: this.apiKey
        }
      });

      if (!response.data.success) {
        throw new Error(`Failed to fetch supported metals: ${response.data.error.message}`);
      }

      const result = Object.entries(response.data.symbols).map(([symbol, name]) => ({
        symbol,
        name,
        type: 'metal'
      }));

      await cache.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch supported metals:')) {
        throw error;
      }
      throw new Error('Failed to fetch supported metals list');
    }
  }
}

// Export an instance with default configuration
const metalPriceService = new MetalPriceService();
module.exports = metalPriceService;
module.exports.MetalPriceService = MetalPriceService;
