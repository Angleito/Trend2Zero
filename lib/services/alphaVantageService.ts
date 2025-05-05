import axios from 'axios';
import {
  AssetData,
  HistoricalDataPoint,
} from '../types';
import { getCachedData } from '../cache'; // Import the MongoDB cache utility

// --- Define Alpha Vantage Specific Response Types --- //

interface AlphaVantageStockQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface AlphaVantageStockResponse {
  'Global Quote': AlphaVantageStockQuote;
}

interface AlphaVantageDailyValue {
  '1. open': string;
  '2. high': string;
  '3. low': string;
  '4. close': string;
  '5. volume': string;
}

interface AlphaVantageCryptoDailyValue {
  '1a. open (USD)': string;
  '1b. open (USD)': string;
  '2a. high (USD)': string;
  '2b. high (USD)': string;
  '3a. low (USD)': string;
  '3b. low (USD)': string;
  '4a. close (USD)': string;
  '4b. close (USD)': string;
  '5. volume': string;
  '6. market cap (USD)': string;
}

interface AlphaVantageHistoricalResponse {
  'Time Series (Daily)': Record<string, AlphaVantageDailyValue>;
}

interface AlphaVantageCryptoResponse {
  'Time Series (Digital Currency Daily)': Record<string, AlphaVantageCryptoDailyValue>;
}

interface AlphaVantageExchangeRateData {
  '1. From_Currency Code': string;
  '2. From_Currency Name': string;
  '3. To_Currency Code': string;
  '4. To_Currency Name': string;
  '5. Exchange Rate': string;
  '6. Last Refreshed': string;
  '7. Time Zone': string;
  '8. Bid Price': string;
  '9. Ask Price': string;
}

interface AlphaVantageExchangeRateResponse {
  'Realtime Currency Exchange Rate': AlphaVantageExchangeRateData;
}

// Interface for the data structure we return
interface CurrencyExchangeRate {
  fromCurrencyCode: string;
  fromCurrencyName: string;
  toCurrencyCode: string;
  toCurrencyName: string;
  exchangeRate: number;
  lastRefreshed: string;
  timeZone: string;
}

// --- End Alpha Vantage Specific Types --- //

export class AlphaVantageService {
  private apiKey: string;
  private baseURL: string;
  private RATE_LIMIT_DELAY = 15 * 1000; // 15 seconds between requests

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.baseURL = 'https://www.alphavantage.co/query';
  }

  private async makeRequest(params: Record<string, string>): Promise<any> {
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
        // we'll proceed, but be aware of potential issues like rate limits
      }
      return response.data;
    } catch (error) {
      console.error('Alpha Vantage API Error:', error);
      throw error;
    }
  }

  async getStockData(symbol: string): Promise<AssetData | null> { // Return null on error/no data
    const cacheKey = `alphavantage_stock_${symbol}`;
    // Use the MongoDB cache utility
    return getCachedData<AssetData | null>(cacheKey, async () => {
      try {
        const stockResponse: AlphaVantageStockResponse = await this.makeRequest({
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
        let btcRate: CurrencyExchangeRate | null = null;
        try {
          if (symbol !== 'BTC') {
            btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');
          }
        } catch (rateError) {
          console.warn(`Could not fetch BTC exchange rate for ${symbol}:`, rateError);
        }

        const usdPrice = parseFloat(data['05. price']);

        return {
          symbol: data['01. symbol'],
          name: data['01. symbol'],
          type: 'Stocks' as const,
          price: parseFloat(data['05. price']),
          change: parseFloat(data['09. change']),
          changePercent: parseFloat(data['10. change percent'].replace('%', '')),
          priceInBTC: btcRate ? parseFloat(data['05. price']) / btcRate.exchangeRate : 0,
          priceInUSD: parseFloat(data['05. price']),
          lastUpdated: data['07. latest trading day']
        };
      } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return null; // Return null on fetch error
      }
    }, 60 * 60 * 6); // 6 hours TTL (21600 seconds)
  }

  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    const cacheKey = `alphavantage_historical_${symbol}_${days}`;
    // Use the MongoDB cache utility
    return getCachedData<HistoricalDataPoint[]>(cacheKey, async () => {
      try {
        const response = await this.makeRequest({
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          outputsize: 'compact' // Use 'full' for more data if needed
        }) as AlphaVantageHistoricalResponse;

        const timeSeries = response['Time Series (Daily)'];
        if (!timeSeries) {
           console.warn(`No time series data found for ${symbol} from Alpha Vantage.`);
           return [];
        }

        return Object.entries(timeSeries)
          .slice(0, days)
          .map(([date, data]) => {
            const dataPoint: HistoricalDataPoint = {
              timestamp: new Date(date).getTime(),
              date: new Date(date),
              value: parseFloat(data['4. close']),
              price: parseFloat(data['4. close']),
              open: parseFloat(data['1. open']),
              high: parseFloat(data['2. high']),
              low: parseFloat(data['3. low']),
              close: parseFloat(data['4. close']),
              volume: parseInt(data['5. volume'])
            };
            return dataPoint;
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure chronological order
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        return []; // Return empty array on error
      }
    }, 60 * 60); // Example: Cache historical data for 1 hour (3600 seconds)
  }

  async getCurrencyExchangeRate(fromCurrency: string, toCurrency: string): Promise<CurrencyExchangeRate | null> {
    const cacheKey = `alphavantage_exchange_${fromCurrency}_${toCurrency}`;
    // Use the MongoDB cache utility
    return getCachedData<CurrencyExchangeRate | null>(cacheKey, async () => {
      try {
        const response = await this.makeRequest({
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: fromCurrency,
          to_currency: toCurrency
        }) as AlphaVantageExchangeRateResponse;

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
      } catch (error) {
        console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
        return null; // Return null on error
      }
    }, 60 * 60 * 6); // 6 hours TTL (21600 seconds)
  }

  async getCryptoCurrencyData(symbol: string): Promise<AssetData | null> { // Return null on error/no data
    const cacheKey = `alphavantage_crypto_${symbol}`;
    // Use the MongoDB cache utility
    return getCachedData<AssetData | null>(cacheKey, async () => {
      try {
        const response = await this.makeRequest({
          function: 'DIGITAL_CURRENCY_DAILY',
          symbol: symbol,
          market: 'USD'
        }) as AlphaVantageCryptoResponse;

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
        let btcRate: CurrencyExchangeRate | null = null;
        try {
           if (symbol !== 'BTC') {
              btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');
           }
        } catch (rateError) {
          console.warn(`Could not fetch BTC exchange rate for crypto ${symbol}:`, rateError);
        }

        const usdPrice = parseFloat(latestData['4b. close (USD)']);

        return {
          symbol: symbol,
          name: symbol,
          type: 'Cryptocurrency' as const,
          price: usdPrice,
          // Alpha Vantage doesn't provide daily change easily here, set to 0 or calculate if needed
          change: 0, 
          changePercent: 0,
          priceInBTC: btcRate ? usdPrice / btcRate.exchangeRate : (symbol === 'BTC' ? 1 : 0),
          priceInUSD: usdPrice,
          lastUpdated: latestDate
        };
      } catch (error) {
        console.error(`Error fetching cryptocurrency data for ${symbol}:`, error);
        return null; // Return null on fetch error
      }
    }, 60 * 60); // 1 hour TTL (3600 seconds)
  }
}