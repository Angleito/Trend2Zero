const axios = require('axios');
const MockDataService = require('./mockDataService');
/**
 * External API Service
 *
 * This service handles all external API calls to fetch market data
 * from various sources like CoinMarketCap, Alpha Vantage, and MetalPriceAPI.
 */
module.exports = {
    constructor() {
        // Rate limiting properties
        this.lastApiCallTimestamp = 0;
        this.API_RATE_LIMIT_MS = 1000; // 1 second between calls
        this.coinMarketCapApiKey = process.env.COINMARKETCAP_API_KEY || '';
        this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
        this.metalPriceApiKey = process.env.METAL_PRICE_API_KEY || '';
        this.mockDataService = new MockDataService();
        this.useMockData = process.env.USE_MOCK_DATA === 'true';
        this.mockDataCacheMinutes = parseInt(process.env.MOCK_DATA_CACHE_MINUTES || '60', 10);
    },
    /**
     * Apply rate limiting to API calls
     */
    async applyRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCallTimestamp;
        if (timeSinceLastCall < this.API_RATE_LIMIT_MS) {
            const waitTime = this.API_RATE_LIMIT_MS - timeSinceLastCall;
            console.log(`Rate limiting: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastApiCallTimestamp = Date.now();
    },
    /**
     * Fetch cryptocurrency list from CoinMarketCap
     */
    async fetchCryptoList(page = 1, pageSize = 20) {
        try {
            // Apply rate limiting
            await this.applyRateLimit();
            // If mock data is enabled, return mock data immediately
            if (this.useMockData) {
                console.log('Using mock data for crypto list');
                return this.mockDataService.getMockCryptoList(page, pageSize);
            }
            if (!this.coinMarketCapApiKey) {
                throw new Error('CoinMarketCap API key is missing');
            }
            const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
                headers: {
                    'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
                },
                params: {
                    start: (page - 1) * pageSize + 1,
                    limit: pageSize,
                    convert: 'USD'
                }
            });
            // Transform the response to match our expected format
            const assets = response.data.data.map((crypto) => ({
                symbol: crypto.symbol,
                name: crypto.name,
                type: 'Cryptocurrency',
                description: crypto.slug
            }));
            return {
                data: assets,
                pagination: {
                    page,
                    pageSize,
                    totalItems: response.data.status.total_count,
                    totalPages: Math.ceil(response.data.status.total_count / pageSize)
                }
            };
        }
        catch (error) {
            // Enhanced error logging for CoinMarketCap API errors
            if (axios.isAxiosError(error)) {
                const apiError = error;
                console.error('CoinMarketCap API Error:', {
                    status: apiError.response?.status,
                    message: apiError.message,
                    data: apiError.response?.data
                });
                // Specific error handling
                switch (apiError.response?.status) {
                    case 401:
                        console.error('Unauthorized: Check your CoinMarketCap API key');
                        break;
                    case 429:
                        console.error('Rate limit exceeded: Slow down requests');
                        break;
                    case 403:
                        console.error('Forbidden: API key may have restrictions');
                        break;
                }
            }
            else {
                console.error('Unexpected error fetching crypto list:', error);
            }
            // If mock data is enabled, fall back
            if (this.useMockData) {
                console.log('Falling back to mock data for crypto list');
                return this.mockDataService.getMockCryptoList(page, pageSize);
            }
            throw error;
        }
    },
    /**
     * Fetch cryptocurrency prices
     */
    async fetchCryptoPrices(symbols) {
        try {
            await this.applyRateLimit();
            if (this.useMockData) {
                console.log('Using mock data for crypto prices');
                return symbols.map(symbol => this.mockDataService.getMockAssetPrice(symbol));
            }
            if (!this.coinMarketCapApiKey) {
                throw new Error('CoinMarketCap API key is missing');
            }
            const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
                headers: {
                    'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
                },
                params: {
                    symbol: symbols.join(','),
                    convert: 'USD'
                }
            });
            // Transform the response to match our expected format
            const prices = symbols.map(symbol => {
                const cryptoData = response.data.data[symbol]?.[0];
                return {
                    symbol,
                    price: cryptoData?.quote?.USD?.price,
                    change: cryptoData?.quote?.USD?.percent_change_24h
                };
            });
            return prices;
        }
        catch (error) {
            console.error('Error fetching crypto prices:', error);
            if (this.useMockData) {
                console.log('Falling back to mock data for crypto prices');
                return symbols.map(symbol => this.mockDataService.getMockAssetPrice(symbol));
            }
            throw error;
        }
    },
    /**
     * Fetch stock price
     */
    async fetchStockPrice(symbol) {
        try {
            await this.applyRateLimit();
            if (this.useMockData) {
                console.log('Using mock data for stock price');
                return this.mockDataService.getMockAssetPrice(symbol);
            }
            if (!this.alphaVantageApiKey) {
                throw new Error('Alpha Vantage API key is missing');
            }
            const response = await axios.get('https://www.alphavantage.co/query', {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: this.alphaVantageApiKey
                }
            });
            const stockData = response.data['Global Quote'];
            return {
                symbol,
                price: parseFloat(stockData['05. price']),
                change: parseFloat(stockData['09. change'])
            };
        }
        catch (error) {
            console.error('Error fetching stock price:', error);
            if (this.useMockData) {
                console.log('Falling back to mock data for stock price');
                return this.mockDataService.getMockAssetPrice(symbol);
            }
            throw error;
        }
    },
    /**
     * Fetch metal price
     */
    async fetchMetalPrice(metal) {
        try {
            await this.applyRateLimit();
            if (this.useMockData) {
                console.log('Using mock data for metal price');
                return this.mockDataService.getMockAssetPrice(metal);
            }
            if (!this.metalPriceApiKey) {
                throw new Error('Metal Price API key is missing');
            }
            const response = await axios.get('https://metals-api.com/api/latest', {
                params: {
                    access_key: this.metalPriceApiKey,
                    base: 'USD',
                    symbols: metal
                }
            });
            return {
                symbol: metal,
                price: response.data.rates[metal]
            };
        }
        catch (error) {
            console.error('Error fetching metal price:', error);
            if (this.useMockData) {
                console.log('Falling back to mock data for metal price');
                return this.mockDataService.getMockAssetPrice(metal);
            }
            throw error;
        }
    }
};
