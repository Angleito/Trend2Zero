// Asset Categories
export type AssetCategory = 'Stocks' | 'Commodities' | 'Indices' | 'Cryptocurrency' | 'Precious Metal';

// Environment type
export type Environment = 'vercel' | 'strapi' | 'development';

// Market Asset Type
export interface MarketAsset {
  id?: string;
  symbol: string;
  name?: string;
  type?: AssetCategory;
  description?: string;
  priceInUSD?: number;
  priceInBTC?: number;
  change24h?: number;
  lastUpdated?: string;
}

// Asset Data Type
export interface AssetData {
  id?: string;
  symbol: string;
  name?: string;
  description?: string;
  type?: AssetCategory;
  currentPrice?: number;
  price: number;
  change: number;
  changePercent: number;
  priceInBTC: number;
  priceInUSD: number;
  lastUpdated?: string;
  historicalData?: HistoricalDataPoint[];
}

// Historical Data Point
export interface HistoricalDataPoint {
  date: string | Date;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

// Market Data Hook Type
export interface MarketData {
  asset: AssetData | null;
  price: number | null;
  historicalData: HistoricalDataPoint[] | null;
  popularAssets: MarketAsset[];
  searchResults: MarketAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Market Data Hook Options
export interface MarketDataOptions {
  symbol?: string | null;
  type?: AssetCategory | null;
  searchQuery?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

// Utility function to create a default asset
export function createDefaultAsset(partialAsset: Partial<AssetData> = {}): AssetData {
  return {
    symbol: partialAsset.symbol || '',
    price: partialAsset.price || 0,
    change: partialAsset.change || 0,
    changePercent: partialAsset.changePercent || 0,
    priceInBTC: partialAsset.priceInBTC || 0,
    priceInUSD: partialAsset.priceInUSD || 0,
    id: partialAsset.id,
    name: partialAsset.name,
    description: partialAsset.description,
    type: partialAsset.type,
    currentPrice: partialAsset.currentPrice,
    historicalData: partialAsset.historicalData || []
  };
}

export type AlphaVantageStockResponse = {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
    [key: string]: any;
  };
};

export type AlphaVantageHistoricalResponse = {
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  [key: string]: any;
};

export type CurrencyExchangeRate = {
  fromCurrencyCode: string;
  fromCurrencyName: string;
  toCurrencyCode: string;
  toCurrencyName: string;
  exchangeRate: number;
  lastRefreshed: string;
  timeZone: string;
  [key: string]: any;
};

export type AlphaVantageExchangeRateResponse = {
  'Realtime Currency Exchange Rate': {
    [key: string]: string;
  };
  [key: string]: any;
};

export type AlphaVantageCryptoResponse = {
  'Realtime Crypto Currency Quote': {
    [key: string]: string;
  };
  [key: string]: any;
};

// Mock integration service configuration
export interface MockIntegrationConfig {
  apiBaseUrl: string;
  strapiBaseUrl: string;
  cacheEnabled: boolean;
  cacheDuration: number;
  mockDataEnabled: boolean;
}

// Mock integration service test result
export interface ServiceTestResult {
  status: string;
  url?: string;
  message?: string;
  error?: string;
}

// Mock integration service test results
export interface ServiceTestResults {
  environment: Environment;
  timestamp: string;
  services: {
    vercelApi?: ServiceTestResult;
    strapiApi?: ServiceTestResult;
    database?: ServiceTestResult;
    [key: string]: ServiceTestResult | undefined;
  };
}