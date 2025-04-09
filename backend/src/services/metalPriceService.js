const axios = require('axios');

class MetalPriceService {
  constructor() {
    this.apiKey = process.env.METAL_PRICE_API_KEY;
    this.baseURL = 'https://api.metalpriceapi.com/v1';
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  _getCachedData(cacheKey) {
    const cachedItem = this.cache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < this.CACHE_DURATION) {
      return cachedItem.data;
    }
    return null;
  }

  _setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  async _makeRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        }
      });

      return response.data;
    } catch (error) {
      console.error('Metal Price API Error:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getCurrentPrices(metals = ['XAU', 'XAG', 'XPT']) {
    const cacheKey = `metal_prices_${metals.join('_')}`;
    const cachedData = this._getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await this._makeRequest('convert', {
        from: 'USD',
        to: metals.join(','),
        amount: 1
      });

      const prices = metals.reduce((acc, metal) => {
        acc[metal] = 1 / response.rates[metal];
        return acc;
      }, {});

      this._setCachedData(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('Error fetching metal prices:', error);
      
      // Fallback prices if API fails
      const fallbackPrices = {
        XAU: 1900, // Gold
        XAG: 23,   // Silver
        XPT: 900   // Platinum
      };

      return metals.reduce((acc, metal) => {
        acc[metal] = fallbackPrices[metal] || 0;
        return acc;
      }, {});
    }
  }

  async getHistoricalPrices(metal, date) {
    const cacheKey = `metal_historical_${metal}_${date}`;
    const cachedData = this._getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await this._makeRequest('historical', {
        date: date,
        base: 'USD',
        currencies: metal
      });

      const historicalPrice = {
        date,
        price: 1 / response.rates[metal]
      };

      this._setCachedData(cacheKey, historicalPrice);
      return historicalPrice;
    } catch (error) {
      console.error(`Error fetching historical price for ${metal}:`, error);
      
      // Fallback historical price
      return {
        date,
        price: this._getFallbackHistoricalPrice(metal)
      };
    }
  }

  _getFallbackHistoricalPrice(metal) {
    const fallbackPrices = {
      XAU: 1850, // Historical gold price
      XAG: 22,   // Historical silver price
      XPT: 850   // Historical platinum price
    };
    return fallbackPrices[metal] || 0;
  }

  async convertMetalPrice(amount, fromMetal, toMetal) {
    try {
      const response = await this._makeRequest('convert', {
        from: fromMetal,
        to: toMetal,
        amount: amount
      });

      return {
        amount: response.result,
        fromMetal,
        toMetal
      };
    } catch (error) {
      console.error(`Error converting metal prices: ${fromMetal} to ${toMetal}`, error);
      
      // Fallback conversion calculation
      const prices = await this.getCurrentPrices([fromMetal, toMetal]);
      const convertedAmount = amount * (prices[toMetal] / prices[fromMetal]);
      
      return {
        amount: convertedAmount,
        fromMetal,
        toMetal
      };
    }
  }
}

module.exports = new MetalPriceService();
