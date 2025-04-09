import axios from 'axios';
import { 
  AssetData, 
  HistoricalDataPoint, 
  CurrencyExchangeRate,
  AlphaVantageStockResponse,
  AlphaVantageHistoricalResponse,
  AlphaVantageCryptoResponse,
  AlphaVantageExchangeRateResponse
} from '../types';

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
        fromCurrency: rateData['1. From_Currency Code'],
        toCurrency: rateData['3. To_Currency Code'],
        exchangeRate: parseFloat(rateData['5. Exchange Rate']),
        lastRefreshed: new Date(rateData['6. Last Refreshed'])
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
      const latestData = Object.entries(timeSeries)[0][1];
      const usdPrice = parseFloat(latestData['4b. close (USD)']);

      const cryptoData = {
        symbol: symbol,
        price: usdPrice,
        change: parseFloat(latestData['5. volume']),
        changePercent: 0, // Alpha Vantage doesn't provide direct percentage change
        priceInBTC: usdPrice / btcRate.exchangeRate,
        priceInUSD: usdPrice
      };

      this.setCachedData(cacheKey, cryptoData);
      return cryptoData;
    } catch (error) {
      console.error(`Error fetching cryptocurrency data for ${symbol}:`, error);
      throw error;
    }
  }
}