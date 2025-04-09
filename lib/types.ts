export interface AssetData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface HistoricalDataPoint {
  date: Date;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CurrencyExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  lastRefreshed: Date;
}

export interface AlphaVantageStockResponse {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export interface AlphaVantageHistoricalResponse {
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

export interface AlphaVantageCryptoResponse {
  'Time Series (Digital Currency Daily)': {
    [date: string]: {
      '4b. close (USD)': string;
      '5. volume': string;
    };
  };
}

export interface AlphaVantageExchangeRateResponse {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string;
    '3. To_Currency Code': string;
    '5. Exchange Rate': string;
    '6. Last Refreshed': string;
  };
}