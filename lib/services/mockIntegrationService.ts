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

    return {
      symbol,
      price: basePrice * priceVariation,
      change: basePrice * 0.02 * (Math.random() > 0.5 ? 1 : -1),
      changePercent: 2.5 * (Math.random() > 0.5 ? 1 : -1),
      priceInBTC: symbol === 'BTC' ? 1 : basePrice / 50000,
      priceInUSD: basePrice * priceVariation,
      lastUpdated: new Date().toISOString()
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
          { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', description: 'Digital gold' },
          { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', description: 'Smart contract platform' },
          { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', description: 'Exchange token' },
          { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', description: 'Smart contract platform' },
          { symbol: 'XRP', name: 'Ripple', type: 'Cryptocurrency', description: 'Payment protocol' },
          { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', description: 'Smart contract platform' },
          { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', description: 'Meme coin' },
          { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', description: 'Interoperability protocol' },
          { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', description: 'Smart contract platform' },
          { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', description: 'Ethereum scaling solution' }
        ];
        break;
      case 'stock':
        assets = [
          { symbol: 'AAPL', name: 'Apple Inc', type: 'Stocks', description: 'Technology company' },
          { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', description: 'Software company' },
          { symbol: 'GOOGL', name: 'Alphabet Inc', type: 'Stocks', description: 'Internet services' },
          { symbol: 'AMZN', name: 'Amazon.com Inc', type: 'Stocks', description: 'E-commerce company' },
          { symbol: 'TSLA', name: 'Tesla Inc', type: 'Stocks', description: 'Electric vehicle manufacturer' },
          { symbol: 'META', name: 'Meta Platforms Inc', type: 'Stocks', description: 'Social media company' },
          { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', description: 'Semiconductor company' },
          { symbol: 'JPM', name: 'JPMorgan Chase & Co', type: 'Stocks', description: 'Banking company' },
          { symbol: 'V', name: 'Visa Inc', type: 'Stocks', description: 'Financial services' },
          { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', description: 'Healthcare company' }
        ];
        break;
      case 'commodity':
        assets = [
          { symbol: 'GC', name: 'Gold', type: 'Commodities', description: 'Precious metal' },
          { symbol: 'SI', name: 'Silver', type: 'Commodities', description: 'Precious metal' },
          { symbol: 'PL', name: 'Platinum', type: 'Commodities', description: 'Precious metal' },
          { symbol: 'PA', name: 'Palladium', type: 'Commodities', description: 'Precious metal' },
          { symbol: 'HG', name: 'Copper', type: 'Commodities', description: 'Industrial metal' },
          { symbol: 'CL', name: 'Crude Oil', type: 'Commodities', description: 'Energy' },
          { symbol: 'NG', name: 'Natural Gas', type: 'Commodities', description: 'Energy' },
          { symbol: 'ZC', name: 'Corn', type: 'Commodities', description: 'Agriculture' },
          { symbol: 'ZW', name: 'Wheat', type: 'Commodities', description: 'Agriculture' },
          { symbol: 'ZS', name: 'Soybeans', type: 'Commodities', description: 'Agriculture' }
        ];
        break;
      case 'index':
        assets = [
          { symbol: 'SPX', name: 'S&P 500', type: 'Indices', description: 'US large-cap stocks' },
          { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', description: 'US blue-chip stocks' },
          { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', description: 'US technology stocks' },
          { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', description: 'US small-cap stocks' },
          { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', description: 'UK large-cap stocks' },
          { symbol: 'DAX', name: 'DAX', type: 'Indices', description: 'German stocks' },
          { symbol: 'CAC', name: 'CAC 40', type: 'Indices', description: 'French stocks' },
          { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', description: 'Japanese stocks' },
          { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', description: 'Hong Kong stocks' },
          { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', description: 'Chinese stocks' }
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
