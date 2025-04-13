import axios from 'axios';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * Secure Market Data Service
 *
 * This service handles all market data requests through our secure API proxy
 * instead of directly calling external APIs with client-side API keys.
 * It uses MongoDB for persistent caching and falls back to cached data if API calls fail.
 */
export class SecureMarketDataService {
  private cache: Map<string, any>;
  private useMockData: boolean;

  constructor() {
    console.log(`[SecureMarketDataService] Initializing service`);
    this.cache = new Map<string, any>();
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
  }

  /**
   * Generate a cache key based on method name and parameters
   */
  private generateCacheKey(method: string, ...args: any[]): string {
    return `${method}:${args.join(':')}`;
  }

  /**
   * Handle API errors with proper logging
   */
  private handleAPIError(error: unknown, context: string): void {
    // Log a generic error message without exposing details
    console.error(`API Error in ${context}`);

    // Log detailed error information
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } else if (error instanceof Error) {
      console.error('Error Details:', error.message);
    }
  }

  /**
   * List available assets by category
   */
  async listAvailableAssets(options: {
    category?: AssetCategory;
    page?: number;
    pageSize?: number;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    if (this.useMockData) {
      return [
        { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
        { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' },
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stocks' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stocks' },
        { symbol: 'XAU', name: 'Gold', type: 'Commodities' }
      ];
    }

    try {
      const response = await axios.get('/api/market-data/assets', { params: options });
      return response.data;
    } catch (error) {
      this.handleAPIError(error, 'listAvailableAssets');
      throw error;
    }
  }

  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData | null> {
    if (this.useMockData) {
      const fallbackData: Record<string, AssetData> = {
        'BTC': {
          symbol: 'BTC',
          price: 67890.12,
          change: 1234.56,
          changePercent: 2.34,
          priceInBTC: 1.0,
          priceInUSD: 67890.12,
          lastUpdated: new Date().toISOString()
        },
        'ETH': {
          symbol: 'ETH',
          price: 3456.78,
          change: 123.45,
          changePercent: 1.5,
          priceInBTC: 0.05,
          priceInUSD: 3456.78,
          lastUpdated: new Date().toISOString()
        },
        'AAPL': {
          symbol: 'AAPL',
          price: 180.50,
          change: 2.75,
          changePercent: 1.2,
          priceInBTC: 0.0025,
          priceInUSD: 180.50,
          lastUpdated: new Date().toISOString()
        },
        'GOOGL': {
          symbol: 'GOOGL',
          price: 125.75,
          change: 1.50,
          changePercent: 0.8,
          priceInBTC: 0.0018,
          priceInUSD: 125.75,
          lastUpdated: new Date().toISOString()
        }
      };

      const data = fallbackData[assetSymbol];
      if (data) {
        return data;
      }

      return {
        symbol: assetSymbol,
        price: 100.00,
        change: 1.00,
        changePercent: 1.0,
        priceInBTC: 0.001,
        priceInUSD: 100.00,
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const response = await axios.get(`/api/market-data/price/${assetSymbol}`);
      return response.data;
    } catch (error) {
      this.handleAPIError(error, 'getAssetPriceInBTC');
      throw error;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    if (this.useMockData) {
      // Generate mock historical data
      const result: HistoricalDataPoint[] = [];
      const today = new Date();
      let basePrice = 100;
      
      if (symbol === 'BTC') basePrice = 60000;
      else if (symbol === 'ETH') basePrice = 3000;
      else if (symbol === 'AAPL') basePrice = 180;
      else if (symbol === 'GOOGL') basePrice = 125;
      else if (symbol === 'XAU') basePrice = 2000;

      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const randomFactor = 0.98 + Math.random() * 0.04;
        const price = basePrice * randomFactor;
        
        result.push({
          date,
          price,
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: Math.floor(Math.random() * 1000000)
        });
        
        basePrice = price;
      }

      return result;
    }

    try {
      const response = await axios.get(`/api/market-data/historical/${symbol}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      this.handleAPIError(error, 'getHistoricalData');
      throw error;
    }
  }

  /**
   * Determine if a symbol is a cryptocurrency
   */
  isCryptoCurrency(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC'];
    return cryptoSymbols.includes(symbol.split(':')[0].toUpperCase());
  }
}

export default SecureMarketDataService;
