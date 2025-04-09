const axios = require('axios');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class CoinMarketCapService {
    constructor(apiKey = process.env.COINMARKETCAP_API_KEY) {
        this.apiKey = apiKey;
        this.baseURL = 'https://pro-api.coinmarketcap.com';
        this.headers = {
            'X-CMC_PRO_API_KEY': this.apiKey
        };
    }

    async getCryptoPrice(symbol) {
        try {
            const cacheKey = `crypto_price_${symbol}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v2/cryptocurrency/quotes/latest`, {
                params: { symbol },
                headers: this.headers
            });

            if (response.data.status?.error_code === 400) {
                throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
            }

            const cryptoData = response.data.data[symbol];
            if (!cryptoData) {
                throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
            }

            const result = {
                symbol,
                price: cryptoData.quote.USD.price,
                lastUpdated: cryptoData.quote.USD.last_updated
            };

            cache.set(cacheKey, result, 300); // Cache for 5 minutes
            return result;
        } catch (error) {
            logger.error('CoinMarketCap API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch price for cryptocurrency: ${symbol}`, 500);
        }
    }

    async getHistoricalData(symbol, startDate, endDate) {
        try {
            const cacheKey = `crypto_historical_${symbol}_${startDate}_${endDate}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v2/cryptocurrency/quotes/historical`, {
                params: {
                    symbol,
                    time_start: startDate,
                    time_end: endDate
                },
                headers: this.headers
            });

            const historicalData = response.data.data.quotes.map(quote => ({
                date: quote.timestamp,
                price: quote.quote.USD.price
            }));

            cache.set(cacheKey, historicalData, 3600); // Cache for 1 hour
            return historicalData;
        } catch (error) {
            logger.error('CoinMarketCap Historical API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch historical data for cryptocurrency: ${symbol}`, 500);
        }
    }

    async searchCrypto(query) {
        try {
            const cacheKey = `crypto_search_${query}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v1/cryptocurrency/map`, {
                params: { symbol: query },
                headers: this.headers
            });

            const results = response.data.data.map(crypto => ({
                symbol: crypto.symbol,
                name: crypto.name
            }));

            cache.set(cacheKey, results, 3600); // Cache for 1 hour
            return results;
        } catch (error) {
            logger.error('CoinMarketCap Search API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to search cryptocurrencies', 500);
        }
    }

    async getMarketOverview() {
        try {
            const cacheKey = 'crypto_market_overview';
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v1/global-metrics/quotes/latest`, {
                headers: this.headers
            });

            const data = response.data.data;
            const result = {
                totalMarketCap: data.total_market_cap.USD,
                total24hVolume: data.total_volume_24h.USD,
                btcDominance: data.btc_dominance,
                ethDominance: data.eth_dominance
            };

            cache.set(cacheKey, result, 300); // Cache for 5 minutes
            return result;
        } catch (error) {
            logger.error('CoinMarketCap Overview API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch market overview', 500);
        }
    }

    async getTopCryptocurrencies(limit = 10) {
        try {
            const cacheKey = `top_cryptos_${limit}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v1/cryptocurrency/listings/latest`, {
                params: {
                    limit,
                    convert: 'USD'
                },
                headers: this.headers
            });

            const topCryptos = response.data.data.map(crypto => ({
                id: crypto.id,
                name: crypto.name,
                symbol: crypto.symbol,
                price: crypto.quote.USD.price,
                marketCap: crypto.quote.USD.market_cap,
                volume24h: crypto.quote.USD.volume_24h,
                percentChange24h: crypto.quote.USD.percent_change_24h,
                lastUpdated: crypto.quote.USD.last_updated
            }));

            cache.set(cacheKey, topCryptos, 300); // Cache for 5 minutes
            return topCryptos;
        } catch (error) {
            logger.error('CoinMarketCap Top Cryptos API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch top cryptocurrencies', 500);
        }
    }

    async getHistoricalCryptoPrices(symbol, timeStart, timeEnd) {
        try {
            const cacheKey = `crypto_historical_${symbol}_${timeStart}_${timeEnd}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v2/cryptocurrency/quotes/historical`, {
                params: {
                    symbol,
                    time_start: timeStart,
                    time_end: timeEnd,
                    convert: 'USD'
                },
                headers: this.headers
            });

            const historicalData = response.data.data[symbol].quotes.map(quote => ({
                timestamp: quote.timestamp,
                price: quote.quote.USD.price,
                volume24h: quote.quote.USD.volume_24h,
                marketCap: quote.quote.USD.market_cap
            }));

            cache.set(cacheKey, historicalData, 3600); // Cache for 1 hour
            return historicalData;
        } catch (error) {
            logger.error('CoinMarketCap Historical API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch historical prices for cryptocurrency: ${symbol}`, 500);
        }
    }

    async getCryptoCurrencyData(symbol) {
        try {
            const cacheKey = `crypto_data_${symbol}`;
            const cachedData = cache.get(cacheKey);
            if (cachedData) return cachedData;

            const response = await axios.get(`${this.baseURL}/v2/cryptocurrency/quotes/latest`, {
                params: { symbol, convert: 'USD' },
                headers: this.headers
            });

            if (response.data.status?.error_code === 400) {
                throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
            }

            const cryptoData = response.data.data[symbol][0];
            if (!cryptoData) {
                throw new AppError(`Cryptocurrency not found: ${symbol}`, 404);
            }

            const result = {
                id: cryptoData.id,
                name: cryptoData.name,
                symbol: cryptoData.symbol,
                price: cryptoData.quote.USD.price,
                marketCap: cryptoData.quote.USD.market_cap,
                volume24h: cryptoData.quote.USD.volume_24h,
                percentChange24h: cryptoData.quote.USD.percent_change_24h,
                lastUpdated: cryptoData.quote.USD.last_updated
            };

            cache.set(cacheKey, result, 300); // Cache for 5 minutes
            return result;
        } catch (error) {
            logger.error('CoinMarketCap API Error:', error.response ? error.response.data : error.message);
            if (error instanceof AppError) throw error;
            throw new AppError(`Failed to fetch data for cryptocurrency: ${symbol}`, 500);
        }
    }
}

module.exports = new CoinMarketCapService();
