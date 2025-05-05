import { CoinGeckoService } from './coinGeckoService';
import { SecureMarketDataService } from './secureMarketDataService';
import {
  MarketAsset,
  AssetPrice,
  HistoricalDataPoint,
  MarketOverview,
  createDefaultAsset
} from '../types';
import { Logger } from 'winston'; // Import Logger type
import logger from '../../backend/src/utils/logger'; // Import the logger instance

/**
 * Market Data Service
 *
 * This service provides a unified interface for accessing market data
 * from various sources. It uses the SecureMarketDataService to ensure
 * that API keys are not exposed to the client.
 */
export class MarketDataService {
  private coinGeckoService: CoinGeckoService;
  private secureService: SecureMarketDataService;
  private useMockData: boolean;
  private logger: Logger; // Add logger property

  constructor() {
    this.logger = logger; // Assign the imported logger instance
    this.logger.info(`[MarketDataService] Initializing service`);
    this.coinGeckoService = new CoinGeckoService();
    // Provide the logger dependency to SecureMarketDataService
    this.secureService = new SecureMarketDataService({ logger: this.logger });
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
  }

  async getMarketOverview(): Promise<MarketOverview | null> { // Allow null return
    try {
      // Use the secureService to get market overview with caching
      return await this.secureService.getMarketOverview();
    } catch (error) {
      this.logger.error('[MarketDataService] Error getting market overview:', error);
      return null; // Return null on error
    }
  }

  async getPopularAssets(): Promise<MarketAsset[]> {
    try {
      // Use the secureService to get popular assets with caching
      return await this.secureService.getPopularAssets();
    } catch (error) {
      this.logger.error('[MarketDataService] Error getting popular assets:', error);
      return []; // Return empty array on error
    }
  }

  async getAssetPrice(assetId: string): Promise<AssetPrice | null> {
    try {
      // Use the secureService to get asset price with caching and load balancing
      // Assuming assetId here is the symbol
      return await this.secureService.getAssetPrice(assetId);
    } catch (error) {
      this.logger.error(`[MarketDataService] Error getting price for asset ${assetId}:`, error);
      return null; // Return null on error
    }
  }

  async getHistoricalData(assetId: string, days: number): Promise<HistoricalDataPoint[]> {
    try {
      // Use the secureService to get historical data with caching
      // Assuming assetId here is the symbol
      return await this.secureService.getHistoricalData(assetId, days);
    } catch (error) {
      this.logger.error(`[MarketDataService] Error getting historical data for asset ${assetId}:`, error);
      return []; // Return empty array on error
    }
  }

  async searchAssets(query: string, limit: number = 10): Promise<MarketAsset[]> {
    try {
      // Use the secureService to search assets with caching
      return await this.secureService.searchAssets(query, limit);
    } catch (error) {
      this.logger.error('[MarketDataService] Error searching assets:', error);
      return []; // Return empty array on error
    }
  }

  async listAvailableAssets(options: { page?: number; pageSize?: number } = {}): Promise<{ data: MarketAsset[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
    try {
      const result = await this.secureService.listAvailableAssets(options);
      return {
        data: result,
        pagination: {
          page: options.page || 1,
          pageSize: options.pageSize || 20,
          totalItems: result.length,
          totalPages: Math.ceil(result.length / (options.pageSize || 20))
        }
      };
    } catch (error) {
      this.logger.error('[MarketDataService] Error listing available assets:', error);
      return { 
        data: [], 
        pagination: { 
          page: options.page || 1, 
          pageSize: options.pageSize || 20, 
          totalItems: 0, 
          totalPages: 0 
        } 
      };
    }
  }

  // The generateMarketSummary method is now in SecureMarketDataService
  // private generateMarketSummary(assets: MarketAsset[]): string {
  //   // ... implementation ...
  // }
}

// Create a singleton instance
const marketDataService = new MarketDataService();

// Export bound methods to preserve "this"
export default marketDataService;
export const getPopularAssets = marketDataService.getPopularAssets.bind(marketDataService);
export const getAssetPrice = marketDataService.getAssetPrice.bind(marketDataService);
export const getHistoricalData = marketDataService.getHistoricalData.bind(marketDataService);
export const searchAssets = marketDataService.searchAssets.bind(marketDataService);
export const getMarketOverview = marketDataService.getMarketOverview.bind(marketDataService); // Export getMarketOverview