import { AssetPrice, MarketAsset, MarketDataOptions, AssetCategory } from '../types';
import { CoinGeckoService } from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService'; // Fixed import to use the default export
import { SecureMarketDataService } from './secureMarketDataService';
import type { AssetData, HistoricalDataPoint } from '../types';

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

  constructor() {
    console.log(`[MarketDataService] Initializing service`);
    this.coinGeckoService = new CoinGeckoService();
    // Using the imported coinMarketCapService singleton instance instead of creating a new one
    this.secureService = new SecureMarketDataService();
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
  }

  async listAvailableAssets(options: MarketDataOptions = {}): Promise<MarketAsset[]> {
    if (this.useMockData) {
      return this.getMockAssets(options.category, options.limit);
    }

    try {
      // Default to CoinGecko for initial implementation
      const assetList = await this.coinGeckoService.getTopAssets(options.limit || 100);
      
      if (options.searchQuery) {
        return assetList.filter(asset => 
          asset.name.toLowerCase().includes(options.searchQuery!.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(options.searchQuery!.toLowerCase())
        );
      }

      if (options.category) {
        return assetList.filter(asset => asset.type === options.category);
      }

      if (options.sortBy) {
        return assetList.sort((a, b) => {
          const aValue = a[options.sortBy!];
          const bValue = b[options.sortBy!];
          return options.sortOrder === 'desc' 
            ? (bValue > aValue ? 1 : -1)
            : (aValue > bValue ? 1 : -1);
        });
      }

      return assetList;
    } catch (error) {
      console.error('[MarketDataService] Error fetching assets:', error);
      return []; // Return empty array instead of throwing to maintain API stability
    }
  }

  async getAssetPrice(symbol: string): Promise<AssetPrice | null> {
    if (this.useMockData) {
      return this.getMockAssets(undefined, 1).find(a => a.symbol === symbol) || null;
    }

    try {
      // Try CoinGecko first
      const price = await this.coinGeckoService.getCryptoPrice(symbol);
      if (price) return price;

      // Fallback to CoinMarketCap
      return await coinMarketCapService.getAssetPrice(symbol);
    } catch (error) {
      console.error(`[MarketDataService] Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, days: number = 7): Promise<any[]> {
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
          timestamp: date.getTime(),
          value: price,
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
      return await this.coinGeckoService.getHistoricalData(symbol, days);
    } catch (error) {
      console.error(`[MarketDataService] Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Determine if an asset is a cryptocurrency based on its symbol
   */
  isCryptoCurrency(symbol: string): boolean {
    // Fallback: treat as crypto if symbol matches common crypto symbols
    const cryptoSymbols = ["BTC", "ETH", "USDT", "BNB", "XRP", "ADA", "DOGE", "SOL", "DOT", "MATIC"];
    return cryptoSymbols.includes(symbol.toUpperCase());
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
        price: 65000,
        changePercent: 2.3,
        priceInUSD: 65000,
        priceInBTC: 1,
        change: 1500,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'Cryptocurrency',
        price: 3500,
        changePercent: 1.5,
        priceInUSD: 3500,
        priceInBTC: 0.05,
        change: 120,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc',
        type: 'Stocks',
        price: 175,
        changePercent: 1.2,
        priceInUSD: 175,
        priceInBTC: 0.003,
        change: 2.5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc',
        type: 'Stocks',
        price: 140,
        changePercent: 1.0,
        priceInUSD: 140,
        priceInBTC: 0.002,
        change: 1.8,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAU',
        name: 'Gold',
        type: 'Precious Metal',
        price: 2000,
        changePercent: -0.2,
        priceInUSD: 2000,
        priceInBTC: 0.03,
        change: -5,
        lastUpdated: new Date().toISOString()
      },
      {
        symbol: 'XAG',
        name: 'Silver',
        type: 'Precious Metal',
        price: 25,
        changePercent: -0.1,
        priceInUSD: 25,
        priceInBTC: 0.0004,
        change: -0.2,
        lastUpdated: new Date().toISOString()
      }
    ];

    const filteredAssets = category 
      ? mockAssets.filter(asset => asset.type === category)
      : mockAssets;

    return filteredAssets.slice(0, limit);
  }
}

// Create a singleton instance and export as default
const marketDataService = new MarketDataService();
export default marketDataService;