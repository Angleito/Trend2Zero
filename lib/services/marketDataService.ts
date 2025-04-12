import { SecureMarketDataService } from './secureMarketDataService';
import type { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * Market Data Service
 *
 * This service provides a unified interface for accessing market data
 * from various sources. It uses the SecureMarketDataService to ensure
 * that API keys are not exposed to the client.
 */
export class MarketDataService {
  private secureService: SecureMarketDataService;
  private useMockData: boolean;

  constructor() {
    console.log(`[MarketDataService] Initializing service`);
    this.secureService = new SecureMarketDataService();
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
  }

  /**
   * List available assets of a specific category
   */
  async listAvailableAssets(options: {
    page?: number;
    pageSize?: number;
    category?: AssetCategory;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    if (this.useMockData) {
      return this.getMockAssets(options.category, options.pageSize);
    }

    return this.secureService.listAvailableAssets(options);
  }

  /**
   * Get asset price in BTC
   */
  async getAssetPriceInBTC(assetSymbol: string): Promise<AssetData | null> {
    return this.secureService.getAssetPriceInBTC(assetSymbol);
  }

  /**
   * Get historical price data for an asset
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalDataPoint[]> {
    return this.secureService.getHistoricalData(symbol, days);
  }

  /**
   * Determine if an asset is a cryptocurrency based on its symbol
   */
  isCryptoCurrency(symbol: string): boolean {
    return this.secureService.isCryptoCurrency(symbol);
  }

  /**
   * Get mock assets when API calls are not available
   */
  getMockAssets(category?: AssetCategory, limit: number = 20): MarketAsset[] {
    const mockAssets: MarketAsset[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'Cryptocurrency',
        description: 'Digital gold',
        priceInUSD: 65000,
        priceInBTC: 1,
        change24h: 1500,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'Cryptocurrency',
        description: 'Smart contract platform',
        priceInUSD: 3500,
        priceInBTC: 0.05,
        change24h: 120,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc',
        type: 'Stocks',
        description: 'Consumer electronics',
        priceInUSD: 175,
        priceInBTC: 0.003,
        change24h: 2.5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc',
        type: 'Stocks',
        description: 'Technology services',
        priceInUSD: 140,
        priceInBTC: 0.002,
        change24h: 1.8,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAU',
        name: 'Gold',
        type: 'Precious Metal',
        description: 'Precious metal',
        priceInUSD: 2000,
        priceInBTC: 0.03,
        change24h: -5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAG',
        name: 'Silver',
        type: 'Precious Metal',
        description: 'Precious metal',
        priceInUSD: 25,
        priceInBTC: 0.0004,
        change24h: -0.2,
        lastUpdated: new Date().toISOString()
      }
    ];

    const filteredAssets = category 
      ? mockAssets.filter(asset => asset.type === category)
      : mockAssets;

    return filteredAssets.slice(0, limit);
  }
}

export default MarketDataService;