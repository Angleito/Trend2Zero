/**
 * Mock Integration Service
 *
 * This service provides mock data and integration points for testing in both Vercel and Strapi environments.
 * It's designed to be a drop-in replacement for real API services when testing or when APIs are unavailable.
 */

import { AssetData, HistoricalDataPoint, MarketAsset } from '../types';

export class MockIntegrationService {
  private environment: 'vercel' | 'strapi' | 'development';

  constructor(environment?: 'vercel' | 'strapi' | 'development') {
    // Auto-detect environment if not specified
    if (!environment) {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.VERCEL) {
          this.environment = 'vercel';
        } else if (process.env.STRAPI_ADMIN) {
          this.environment = 'strapi';
        } else {
          this.environment = 'development';
        }
      } else {
        this.environment = 'development';
      }
    } else {
      this.environment = environment;
    }

    console.log(`MockIntegrationService initialized in ${this.environment} environment`);
  }

  /**
   * Get the current environment
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Get mock crypto data
   */
  async getMockCryptoData(symbol: string = 'BTC'): Promise<AssetData> {
    // Generate slightly different data based on environment for testing
    const basePrice = symbol === 'BTC' ? 50000 : 3000;
    const priceVariation = this.environment === 'vercel' ? 1.05 : (this.environment === 'strapi' ? 0.95 : 1);

    const price = basePrice * priceVariation;
    const change = basePrice * 0.02 * (Math.random() > 0.5 ? 1 : -1);
    const changePercent = 2.5 * (Math.random() > 0.5 ? 1 : -1);
    const priceInBTC = symbol === 'BTC' ? 1 : basePrice / 50000;
    const priceInUSD = basePrice * priceVariation;
    const lastUpdated = new Date().toISOString();

    return {
      symbol,
      name: symbol,
      type: 'Cryptocurrency' as const,
      price,
      change,
      changePercent,
      priceInBTC,
      priceInUSD,
      lastUpdated
    };
  }

  /**
   * Get mock historical data
   */
  async getMockHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    const result: HistoricalDataPoint[] = [];
    const today = new Date();

    // Base values for different symbols
    let baseValue = symbol.toUpperCase() === 'BTC' ? 50000 : 3000;

    // Add environment-specific variation
    if (this.environment === 'vercel') {
      baseValue *= 1.05; // 5% higher on Vercel
    } else if (this.environment === 'strapi') {
      baseValue *= 0.95; // 5% lower on Strapi
    }

    // Generate data points for each day
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Add some random variation
      const randomFactor = 0.02; // 2% max variation
      const dailyVariation = baseValue * randomFactor * (Math.random() * 2 - 1);
      const price = baseValue + dailyVariation;

      // Update base value for next day
      baseValue = price;

      // Generate more realistic data with open, high, low, close, and volume
      const open = price * (1 - 0.005 + Math.random() * 0.01);
      const high = price * (1 + 0.005 + Math.random() * 0.01);
      const low = price * (1 - 0.005 - Math.random() * 0.01);
      const close = price;
      const volume = symbol.toUpperCase() === 'BTC' ?
        1000000000 + Math.random() * 500000000 :
        1000000 + Math.random() * 500000;

      result.push({
        timestamp: date.getTime(),
        value: close,
        date: new Date(date),
        price: parseFloat(price.toFixed(2)),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.round(volume)
      });
    }

    return result;
  }

  /**
   * Get mock asset list
   */
  async getMockAssetList(
    assetType: 'crypto' | 'stock' | 'commodity' | 'index',
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: MarketAsset[], pagination: any }> {
    let assets: MarketAsset[] = [];

    switch (assetType) {
      case 'crypto':
        assets = [
          { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', price: 65000, change: 1500, changePercent: 2.3, priceInBTC: 1, priceInUSD: 65000, lastUpdated: new Date().toISOString() },
          { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', price: 3500, change: 120, changePercent: 1.5, priceInBTC: 0.054, priceInUSD: 3500, lastUpdated: new Date().toISOString() },
          { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', price: 500, change: 10, changePercent: 2.0, priceInBTC: 0.0077, priceInUSD: 500, lastUpdated: new Date().toISOString() },
          { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', price: 150, change: 3, changePercent: 2.1, priceInBTC: 0.0023, priceInUSD: 150, lastUpdated: new Date().toISOString() },
          { symbol: 'XRP', name: 'Ripple', type: 'Cryptocurrency', price: 1.2, change: 0.02, changePercent: 1.7, priceInBTC: 0.000018, priceInUSD: 1.2, lastUpdated: new Date().toISOString() },
          { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', price: 2.5, change: 0.05, changePercent: 2.0, priceInBTC: 0.000038, priceInUSD: 2.5, lastUpdated: new Date().toISOString() },
          { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', price: 0.15, change: 0.01, changePercent: 1.8, priceInBTC: 0.0000023, priceInUSD: 0.15, lastUpdated: new Date().toISOString() },
          { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', price: 20, change: 0.4, changePercent: 2.0, priceInBTC: 0.00031, priceInUSD: 20, lastUpdated: new Date().toISOString() },
          { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', price: 35, change: 0.7, changePercent: 2.0, priceInBTC: 0.00054, priceInUSD: 35, lastUpdated: new Date().toISOString() },
          { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', price: 1.5, change: 0.03, changePercent: 2.0, priceInBTC: 0.000023, priceInUSD: 1.5, lastUpdated: new Date().toISOString() }
        ];
        break;
      case 'stock':
        assets = [
          { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks', price: 175, change: 2, changePercent: 1.2, priceInBTC: 0.0027, priceInUSD: 175, lastUpdated: new Date().toISOString() },
          { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', price: 350, change: 4, changePercent: 1.1, priceInBTC: 0.0054, priceInUSD: 350, lastUpdated: new Date().toISOString() },
          { symbol: 'GOOGL', name: 'Alphabet Inc', type: 'Stocks', price: 2800, change: 30, changePercent: 1.1, priceInBTC: 0.043, priceInUSD: 2800, lastUpdated: new Date().toISOString() },
          { symbol: 'AMZN', name: 'Amazon.com Inc', type: 'Stocks', price: 3500, change: 40, changePercent: 1.2, priceInBTC: 0.054, priceInUSD: 3500, lastUpdated: new Date().toISOString() },
          { symbol: 'TSLA', name: 'Tesla Inc', type: 'Stocks', price: 250, change: 5, changePercent: 2.0, priceInBTC: 0.0038, priceInUSD: 250, lastUpdated: new Date().toISOString() },
          { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stocks', price: 480, change: 8, changePercent: 1.7, priceInBTC: 0.0074, priceInUSD: 480, lastUpdated: new Date().toISOString() },
          { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', price: 880, change: 20, changePercent: 2.3, priceInBTC: 0.014, priceInUSD: 880, lastUpdated: new Date().toISOString() },
          { symbol: 'JPM', name: 'JPMorgan Chase & Co', type: 'Stocks', price: 180, change: 2, changePercent: 1.1, priceInBTC: 0.0028, priceInUSD: 180, lastUpdated: new Date().toISOString() },
          { symbol: 'V', name: 'Visa Inc', type: 'Stocks', price: 270, change: 3, changePercent: 1.2, priceInBTC: 0.0042, priceInUSD: 270, lastUpdated: new Date().toISOString() },
          { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', price: 155, change: 1, changePercent: 0.7, priceInBTC: 0.0024, priceInUSD: 155, lastUpdated: new Date().toISOString() }
        ];
        break;
      case 'commodity':
        assets = [
          { symbol: 'GC', name: 'Gold', type: 'Commodity', price: 2000, change: 10, changePercent: 0.5, priceInBTC: 0.031, priceInUSD: 2000, lastUpdated: new Date().toISOString() },
          { symbol: 'SI', name: 'Silver', type: 'Commodity', price: 25, change: 0.1, changePercent: 0.4, priceInBTC: 0.00038, priceInUSD: 25, lastUpdated: new Date().toISOString() },
          { symbol: 'PL', name: 'Platinum', type: 'Commodity', price: 950, change: 5, changePercent: 0.6, priceInBTC: 0.015, priceInUSD: 950, lastUpdated: new Date().toISOString() },
          { symbol: 'PA', name: 'Palladium', type: 'Commodity', price: 1200, change: 8, changePercent: 0.7, priceInBTC: 0.018, priceInUSD: 1200, lastUpdated: new Date().toISOString() },
          { symbol: 'HG', name: 'Copper', type: 'Commodity', price: 4.5, change: 0.02, changePercent: 0.4, priceInBTC: 0.000069, priceInUSD: 4.5, lastUpdated: new Date().toISOString() },
          { symbol: 'CL', name: 'Crude Oil', type: 'Commodity', price: 85, change: 1, changePercent: 1.2, priceInBTC: 0.0013, priceInUSD: 85, lastUpdated: new Date().toISOString() },
          { symbol: 'NG', name: 'Natural Gas', type: 'Commodity', price: 3.5, change: 0.05, changePercent: 1.4, priceInBTC: 0.000054, priceInUSD: 3.5, lastUpdated: new Date().toISOString() },
          { symbol: 'ZC', name: 'Corn', type: 'Commodity', price: 600, change: 5, changePercent: 0.8, priceInBTC: 0.0092, priceInUSD: 600, lastUpdated: new Date().toISOString() },
          { symbol: 'ZW', name: 'Wheat', type: 'Commodity', price: 700, change: 6, changePercent: 0.9, priceInBTC: 0.011, priceInUSD: 700, lastUpdated: new Date().toISOString() },
          { symbol: 'ZS', name: 'Soybeans', type: 'Commodity', price: 1400, change: 8, changePercent: 0.6, priceInBTC: 0.022, priceInUSD: 1400, lastUpdated: new Date().toISOString() }
        ];
        break;
      case 'index':
        assets = [
          { symbol: 'SPX', name: 'S&P 500', type: 'Indices', price: 4200, change: 30, changePercent: 0.7, priceInBTC: 0.065, priceInUSD: 4200, lastUpdated: new Date().toISOString() },
          { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', price: 34000, change: 200, changePercent: 0.6, priceInBTC: 0.52, priceInUSD: 34000, lastUpdated: new Date().toISOString() },
          { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', price: 14000, change: 120, changePercent: 0.9, priceInBTC: 0.22, priceInUSD: 14000, lastUpdated: new Date().toISOString() },
          { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', price: 2000, change: 15, changePercent: 0.75, priceInBTC: 0.031, priceInUSD: 2000, lastUpdated: new Date().toISOString() },
          { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', price: 7500, change: 50, changePercent: 0.67, priceInBTC: 0.12, priceInUSD: 7500, lastUpdated: new Date().toISOString() },
          { symbol: 'DAX', name: 'DAX', type: 'Indices', price: 16000, change: 100, changePercent: 0.63, priceInBTC: 0.25, priceInUSD: 16000, lastUpdated: new Date().toISOString() },
          { symbol: 'CAC', name: 'CAC 40', type: 'Indices', price: 7000, change: 60, changePercent: 0.86, priceInBTC: 0.11, priceInUSD: 7000, lastUpdated: new Date().toISOString() },
          { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', price: 30000, change: 200, changePercent: 0.7, priceInBTC: 0.46, priceInUSD: 30000, lastUpdated: new Date().toISOString() },
          { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', price: 25000, change: 180, changePercent: 0.72, priceInBTC: 0.38, priceInUSD: 25000, lastUpdated: new Date().toISOString() },
          { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', price: 3500, change: 25, changePercent: 0.71, priceInBTC: 0.054, priceInUSD: 3500, lastUpdated: new Date().toISOString() }
        ];
        break;
    }

    // Add environment-specific marker to asset names for testing
    assets = assets.map(asset => ({
      ...asset,
      name: `${asset.name} [${this.environment}]`
    }));

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, assets.length);
    const paginatedAssets = assets.slice(start, end);

    return {
      data: paginatedAssets,
      pagination: {
        page,
        pageSize,
        totalItems: assets.length,
        totalPages: Math.ceil(assets.length / pageSize)
      }
    };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): Record<string, any> {
    switch (this.environment) {
      case 'vercel':
        return {
          apiBaseUrl: 'https://trend2zero.vercel.app/api',
          strapiBaseUrl: process.env.STRAPI_API_URL || 'https://trend2zero-strapi.vercel.app',
          cacheEnabled: true,
          cacheDuration: 3600, // 1 hour
          mockDataEnabled: true
        };
      case 'strapi':
        return {
          apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
          strapiBaseUrl: 'http://localhost:1337',
          cacheEnabled: true,
          cacheDuration: 300, // 5 minutes
          mockDataEnabled: true
        };
      default:
        return {
          apiBaseUrl: 'http://localhost:3000/api',
          strapiBaseUrl: 'http://localhost:1337',
          cacheEnabled: false,
          cacheDuration: 60, // 1 minute
          mockDataEnabled: true
        };
    }
  }

  /**
   * Test connection to external services
   */
  async testConnections(): Promise<Record<string, any>> {
    const results: Record<string, any> = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Test Vercel API connection
    try {
      const vercelApiUrl = this.getEnvironmentConfig().apiBaseUrl + '/health';
      results.services.vercelApi = {
        status: 'mocked',
        url: vercelApiUrl,
        message: `Mock connection to Vercel API in ${this.environment} environment`
      };
    } catch (error: any) {
      results.services.vercelApi = {
        status: 'error',
        message: error.message
      };
    }

    // Test Strapi API connection
    try {
      const strapiApiUrl = this.getEnvironmentConfig().strapiBaseUrl + '/api/assets';
      results.services.strapiApi = {
        status: 'mocked',
        url: strapiApiUrl,
        message: `Mock connection to Strapi API in ${this.environment} environment`
      };
    } catch (error: any) {
      results.services.strapiApi = {
        status: 'error',
        message: error.message
      };
    }

    // Test database connection
    try {
      results.services.database = {
        status: 'mocked',
        type: this.environment === 'strapi' ? 'SQLite' : 'MongoDB',
        message: `Mock connection to database in ${this.environment} environment`
      };
    } catch (error: any) {
      results.services.database = {
        status: 'error',
        message: error.message
      };
    }

    return results;
  }
}

export default MockIntegrationService;
