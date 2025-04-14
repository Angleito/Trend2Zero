import axios from 'axios';
import {
  AssetData,
  HistoricalDataPoint,
} from '../types';

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
  private cache: Map<string, { data: any, timestamp: number }>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private RATE_LIMIT_DELAY = 15 * 1000; // 15 seconds between requests

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.baseURL = 'https://www.alphavantage.co/query';
    this.cache = new Map();
  }

  private getCachedData(cacheKey: string): any | null {
    const cachedItem = this.cache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < this.CACHE_DURATION) {
      return cachedItem.data;
    }
    return null;
  }

  private setCachedData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
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
      return response.data;
    } catch (error) {
      console.error('Alpha Vantage API Error:', error);
      throw error;
    }
  }

  async getStockData(symbol: string): Promise<AssetData> {
    const cacheKey = `stock_${symbol}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      // Fetch stock data
      const stockResponse = await this.makeRequest({
        function: 'GLOBAL_QUOTE',
        symbol: symbol
      }) as AlphaVantageStockResponse;

      // Fetch BTC exchange rate
      const btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');

      const data = stockResponse['Global Quote'];
      const stockData = {
        symbol: data['01. symbol'],
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        priceInBTC: parseFloat(data['05. price']) / btcRate.exchangeRate,
        priceInUSD: parseFloat(data['05. price'])
      };

      this.setCachedData(cacheKey, stockData);
      return stockData;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw error;
    }
  }

  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    const cacheKey = `historical_${symbol}_${days}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await this.makeRequest({
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: 'compact'
      }) as AlphaVantageHistoricalResponse;

      const timeSeries = response['Time Series (Daily)'];
      const historicalData: HistoricalDataPoint[] = Object.entries(timeSeries)
        .slice(0, days)
        .map(([dateStr, data]) => ({
          timestamp: dateStr, // Keep timestamp as string initially or parse here
          value: parseFloat(data['4. close']),
          date: new Date(dateStr),
          price: parseFloat(data['4. close']),
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }));

      this.setCachedData(cacheKey, historicalData);
      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  async getCurrencyExchangeRate(fromCurrency: string, toCurrency: string): Promise<CurrencyExchangeRate> {
    const cacheKey = `exchange_${fromCurrency}_${toCurrency}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await this.makeRequest({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency
      }) as AlphaVantageExchangeRateResponse;
      
      const rateData = response['Realtime Currency Exchange Rate'];
      const exchangeRate = {
        fromCurrencyCode: rateData['1. From_Currency Code'],
        fromCurrencyName: rateData['2. From_Currency Name'],
        toCurrencyCode: rateData['3. To_Currency Code'],
        toCurrencyName: rateData['4. To_Currency Name'],
        exchangeRate: parseFloat(rateData['5. Exchange Rate']),
        lastRefreshed: rateData['6. Last Refreshed'],
        timeZone: rateData['7. Time Zone']
      };

      this.setCachedData(cacheKey, exchangeRate);
      return exchangeRate;
    } catch (error) {
      console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
      throw error;
    }
  }

  async getCryptoCurrencyData(symbol: string): Promise<AssetData> {
    const cacheKey = `crypto_${symbol}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      // Fetch crypto data
      const response = await this.makeRequest({
        function: 'DIGITAL_CURRENCY_DAILY',
        symbol: symbol,
        market: 'USD'
      }) as AlphaVantageCryptoResponse;

      // Fetch BTC exchange rate
      const btcRate = await this.getCurrencyExchangeRate(symbol, 'BTC');

      const timeSeries = response['Time Series (Digital Currency Daily)'];
      const latestDate = Object.keys(timeSeries)[0];
      const latestData = timeSeries[latestDate]; // Access data for the latest date
      const usdPrice = parseFloat(latestData['4b. close (USD)']);

      const cryptoData: AssetData = {
        symbol: symbol,
        price: usdPrice,
        change: parseFloat(latestData['5. volume']), // Volume as change for now?
        changePercent: 0, // Alpha Vantage doesn't provide direct percentage change for daily crypto
        priceInBTC: btcRate ? usdPrice / btcRate.exchangeRate : undefined, // Handle case where btcRate is undefined
        priceInUSD: usdPrice,
        lastUpdated: latestDate // Use the date as last updated
      };

      this.setCachedData(cacheKey, cryptoData);
      return cryptoData;
    } catch (error) {
      console.error(`Error fetching cryptocurrency data for ${symbol}:`, error);
      throw error;
    }
  }
}