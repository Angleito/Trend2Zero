import axios from 'axios';
import { getCachedData } from '../cache'; // Import the MongoDB cache utility
// --- End Alpha Vantage Specific Types --- //
export class AlphaVantageService {
    constructor() {
        this.RATE_LIMIT_DELAY = 15 * 1000; // 15 seconds between requests
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
        this.baseURL = 'https://www.alphavantage.co/query';
    }
    async makeRequest(params) {
        try {
            // Implement basic rate limiting
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
            const response = await axios.get(this.baseURL, {
                params: {
                    ...params,
                    apikey: this.apiKey
                }
            });
            // Basic check for common Alpha Vantage API errors/notes
            if (response.data.Note || response.data['Error Message']) {
                console.warn('Alpha Vantage API Note/Error:', response.data.Note || response.data['Error Message']);
                // Depending on the error, you might want to throw or return an empty/default state
                // For now, we'll proceed, but be aware of potential issues like rate limits
            }
            return response.data;
        }
        catch (error) {
            console.error('Alpha Vantage API Error:', error);
            throw error;
        }
    }
    async getStockData(symbol) {
        const cacheKey = `alphavantage_stock_${symbol}`;
        // Use the MongoDB cache utility
        return getCachedData(cacheKey, async () => {
            try {
                const stockResponse = await this.makeRequest({
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol
                });
                const data = stockResponse['Global Quote'];
                if (!data || Object.keys(data).length === 0 || !data['01. symbol']) {
                    console.warn(`No valid stock data returned for ${symbol} from Alpha Vantage.`);
                    return null; // Return null if API response is empty or invalid
                }
                // Fetch BTC exchange rate (consider caching this separately if needed frequently)
                // Note: Getting BTC rate might fail if the symbol IS BTC or isn't convertible
                let btcRate = null;
                try {
                    if (symbol !== 'BTC') {
                        btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');
                    }
                }
                catch (rateError) {
                    console.warn(`Could not fetch BTC exchange rate for ${symbol}:`, rateError);
                }
                const usdPrice = parseFloat(data['05. price']);
                return {
                    symbol: data['01. symbol'],
                    price: usdPrice,
                    change: parseFloat(data['09. change']),
                    changePercent: parseFloat(data['10. change percent'].replace('%', '')),
                    priceInUSD: usdPrice,
                    priceInBTC: btcRate ? usdPrice / btcRate.exchangeRate : undefined,
                    lastUpdated: data['07. latest trading day']
                };
            }
            catch (error) {
                console.error(`Error fetching stock data for ${symbol}:`, error);
                return null; // Return null on fetch error
            }
        }, 60 * 60 * 6); // 6 hours TTL (21600 seconds)
    }
    async getHistoricalData(symbol, days = 30) {
        const cacheKey = `alphavantage_historical_${symbol}_${days}`;
        // Use the MongoDB cache utility
        return getCachedData(cacheKey, async () => {
            try {
                const response = await this.makeRequest({
                    function: 'TIME_SERIES_DAILY',
                    symbol: symbol,
                    outputsize: 'compact' // Use 'full' for more data if needed
                });
                const timeSeries = response['Time Series (Daily)'];
                if (!timeSeries) {
                    console.warn(`No time series data found for ${symbol} from Alpha Vantage.`);
                    return [];
                }
                return Object.entries(timeSeries)
                    .slice(0, days)
                    .map(([dateStr, data]) => ({
                    timestamp: dateStr,
                    value: parseFloat(data['4. close']),
                    date: new Date(dateStr),
                    price: parseFloat(data['4. close']),
                    open: parseFloat(data['1. open']),
                    high: parseFloat(data['2. high']),
                    low: parseFloat(data['3. low']),
                    close: parseFloat(data['4. close']),
                    volume: parseInt(data['5. volume'])
                }))
                    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure chronological order
            }
            catch (error) {
                console.error(`Error fetching historical data for ${symbol}:`, error);
                return []; // Return empty array on error
            }
        }, 60 * 60); // Example: Cache historical data for 1 hour (3600 seconds)
    }
    async getCurrencyExchangeRate(fromCurrency, toCurrency) {
        const cacheKey = `alphavantage_exchange_${fromCurrency}_${toCurrency}`;
        // Use the MongoDB cache utility
        return getCachedData(cacheKey, async () => {
            try {
                const response = await this.makeRequest({
                    function: 'CURRENCY_EXCHANGE_RATE',
                    from_currency: fromCurrency,
                    to_currency: toCurrency
                });
                const rateData = response['Realtime Currency Exchange Rate'];
                if (!rateData || Object.keys(rateData).length === 0 || !rateData['1. From_Currency Code']) {
                    console.warn(`No valid exchange rate data returned for ${fromCurrency} to ${toCurrency}.`);
                    return null;
                }
                return {
                    fromCurrencyCode: rateData['1. From_Currency Code'],
                    fromCurrencyName: rateData['2. From_Currency Name'],
                    toCurrencyCode: rateData['3. To_Currency Code'],
                    toCurrencyName: rateData['4. To_Currency Name'],
                    exchangeRate: parseFloat(rateData['5. Exchange Rate']),
                    lastRefreshed: rateData['6. Last Refreshed'],
                    timeZone: rateData['7. Time Zone']
                };
            }
            catch (error) {
                console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
                return null; // Return null on error
            }
        }, 60 * 60 * 6); // 6 hours TTL (21600 seconds)
    }
    async getCryptoCurrencyData(symbol) {
        const cacheKey = `alphavantage_crypto_${symbol}`;
        // Use the MongoDB cache utility
        return getCachedData(cacheKey, async () => {
            try {
                const response = await this.makeRequest({
                    function: 'DIGITAL_CURRENCY_DAILY',
                    symbol: symbol,
                    market: 'USD'
                });
                const timeSeries = response['Time Series (Digital Currency Daily)'];
                if (!timeSeries) {
                    console.warn(`No time series data found for crypto ${symbol} from Alpha Vantage.`);
                    return null;
                }
                const latestDate = Object.keys(timeSeries)[0];
                const latestData = timeSeries[latestDate];
                if (!latestData) {
                    console.warn(`No latest daily data found for crypto ${symbol} from Alpha Vantage.`);
                    return null;
                }
                // Fetch BTC exchange rate (consider caching)
                let btcRate = null;
                try {
                    if (symbol !== 'BTC') {
                        btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');
                    }
                }
                catch (rateError) {
                    console.warn(`Could not fetch BTC exchange rate for crypto ${symbol}:`, rateError);
                }
                const usdPrice = parseFloat(latestData['4b. close (USD)']);
                return {
                    symbol: symbol,
                    price: usdPrice,
                    // Alpha Vantage doesn't provide daily change easily here, set to 0 or calculate if needed
                    change: 0,
                    changePercent: 0,
                    priceInBTC: btcRate ? usdPrice / btcRate.exchangeRate : (symbol === 'BTC' ? 1 : undefined),
                    priceInUSD: usdPrice,
                    lastUpdated: latestDate
                };
            }
            catch (error) {
                console.error(`Error fetching cryptocurrency data for ${symbol}:`, error);
                return null; // Return null on fetch error
            }
        }, 60 * 60); // 1 hour TTL (3600 seconds)
    }
}
