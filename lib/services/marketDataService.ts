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

  constructor(useMockData: boolean = true) {
    console.log('[MarketDataService] Initializing service');
    this.secureService = new SecureMarketDataService(useMockData);
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
}