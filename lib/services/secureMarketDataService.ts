import { 
  MarketAsset, 
  AssetCategory, 
  AssetPrice,
  HistoricalDataPoint,
  normalizeHistoricalDataPoint,
  AssetData,
  MarketDataOptions
} from '../types';
import axios from 'axios';
import MongoDbCacheService from './mongoDbCacheService';
import coinGeckoService from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService';
import metalPriceService from './metalPriceService';

// Predefined list of assets with correct type casing
const predefinedAssets: MarketAsset[] = [
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    type: 'cryptocurrency', 
    id: 'bitcoin' 
  },
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    type: 'cryptocurrency', 
    id: 'ethereum' 
  },
  { 
    symbol: 'AAPL', 
    name: 'Apple Inc.', 
    type: 'stocks', 
    id: 'apple' 
  },
  { 
    symbol: 'GOOGL', 
    name: 'Alphabet Inc.', 
    type: 'stocks', 
    id: 'alphabet' 
  },
  { 
    symbol: 'XAU', 
    name: 'Gold', 
    type: 'metals', 
    id: 'gold' 
  }
];

interface MarketDataServiceDependencies {
  mongoDbCacheService?: MongoDbCacheService;
  coinGeckoService?: typeof coinGeckoService;
  coinMarketCapService?: typeof coinMarketCapService;
  metalPriceService?: typeof metalPriceService;
}

class SecureMarketDataService {
  private mongoDbCacheService: MongoDbCacheService;
  private coinGeckoService: typeof coinGeckoService;
  private coinMarketCapService: typeof coinMarketCapService;
  private metalPriceService: typeof metalPriceService;

  constructor(deps: MarketDataServiceDependencies = {}) {
    this.mongoDbCacheService = deps.mongoDbCacheService || new MongoDbCacheService();
    this.coinGeckoService = deps.coinGeckoService || coinGeckoService;
    this.coinMarketCapService = deps.coinMarketCapService || coinMarketCapService;
    this.metalPriceService = deps.metalPriceService || metalPriceService;
  }

  // Public method to allow mocking in tests
  public async getAssetBySymbol(symbol: string): Promise<MarketAsset | null> {
    try {
      // Try to get from cache first
      const cachedData = await this.mongoDbCacheService.getCachedAssetList(symbol, 1, 1);
      
      if (cachedData && 'data' in cachedData) {
        const assets = cachedData.data.data as MarketAsset[];
        const asset = assets[0];
        
        if (asset) {
          console.log(`[SecureMarketData] Cache hit for asset ${symbol}`);
          return asset;
        }
      }

      // If not found in cache, search in predefined assets
      const asset = predefinedAssets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase());
      
      // Cache the asset if found
      if (asset) {
        await this.mongoDbCacheService.cacheAssetList(symbol, 1, 1, {
          data: [asset],
          pagination: { total: 1 }
        });
      }
      
      return asset || null;
    } catch (error) {
      console.error(`Error fetching asset by symbol ${symbol}:`, error);
      // Fallback to direct search in case of cache error
      return predefinedAssets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase()) || null;
    }
  }

  async getAssetPrice(symbol: string, options?: {
    timeout?: number,
    fallbackToRandom?: boolean
  }): Promise<AssetPrice | null> {
    const {
      timeout = 5000,  // 5 seconds default timeout
      fallbackToRandom = true
    } = options || {};

    try {
      console.log(`[SecureMarketData] Fetching price for ${symbol}`);

      // Implement timeout wrapper
      const timeoutPromise = new Promise<AssetPrice | null>((_, reject) =>
        setTimeout(() => reject(new Error('Price fetch timeout')), timeout)
      );

      // Try to get from cache first
      const cachedDataPromise = this.mongoDbCacheService.getCachedAssetPrice(symbol);
      const cachedData = await Promise.race([cachedDataPromise, timeoutPromise]);

      // Type guard to ensure AssetPrice
      if (cachedData && 'data' in cachedData && this.isAssetPrice(cachedData.data)) {
        console.log(`[SecureMarketData] Cache hit for ${symbol}`);
        return cachedData.data;
      }

      // If not found in cache, continue with fetching fresh data
      const asset = await this.getAssetBySymbol(symbol);
      if (!asset) {
        console.warn(`[SecureMarketData] Asset not found: ${symbol}`);
        return null;
      }

      let fetchError: Error | null = null;
      let assetPrice: AssetPrice | null = null;
      
      // Use the appropriate service based on asset type with enhanced logging
      try {
        if (asset.type === 'cryptocurrency') {
          if (asset.id) {
            console.log(`[SecureMarketData] Fetching crypto price for ${symbol} via CoinGecko`);
            assetPrice = await this.coinGeckoService.getAssetPrice(asset.id);
            
            if (!assetPrice) {
              console.warn(`[SecureMarketData] CoinGecko failed, falling back to CoinMarketCap for ${symbol}`);
              assetPrice = await this.coinMarketCapService.getAssetPrice(asset.id);
            }
          }
        } else if (asset.type === 'metals') {
          console.log(`[SecureMarketData] Fetching metal price for ${symbol}`);
          assetPrice = await this.metalPriceService.getMetalPrice(asset.symbol);
        } else {
          // Configurable fallback strategy
          if (fallbackToRandom) {
            console.warn(`[SecureMarketData] Generating random price for ${symbol}`);
            assetPrice = {
              id: asset.id,
              symbol: asset.symbol,
              name: asset.name,
              type: asset.type,
              price: Math.random() * 1000,
              change: Math.random() * 10,
              changePercent: Math.random() * 5,
              priceInBTC: Math.random() * 0.1,
              priceInUSD: Math.random() * 1000,
              lastUpdated: new Date().toISOString()
            };
          } else {
            console.warn(`[SecureMarketData] No price data available for ${symbol}`);
            return null;
          }
        }
      } catch (error) {
        fetchError = error instanceof Error ? error : new Error('Unknown fetch error');
        console.error(`[SecureMarketData] Price fetch error for ${symbol}:`, fetchError);
      }

      // Fallback to random price if fetch fails and fallbackToRandom is true
      if (!assetPrice && fallbackToRandom) {
        console.warn(`[SecureMarketData] Generating random price due to fetch failure for ${symbol}`);
        assetPrice = {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          price: Math.random() * 1000,
          change: fetchError ? 0 : Math.random() * 10,
          changePercent: fetchError ? 0 : Math.random() * 5,
          priceInBTC: Math.random() * 0.1,
          priceInUSD: Math.random() * 1000,
          lastUpdated: new Date().toISOString()
        };
      }

      if (assetPrice) {
        // Cache the data with error handling
        try {
          await this.mongoDbCacheService.cacheAssetPrice(symbol, assetPrice);
        } catch (cacheError) {
          console.error(`[SecureMarketData] Cache error for ${symbol}:`, cacheError);
        }
      }

      return assetPrice;
    } catch (error) {
      console.error(`[SecureMarketData] Critical error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  // Type guard to validate AssetPrice
  private isAssetPrice(data: any): data is AssetPrice {
    return data &&
      typeof data.id === 'string' &&
      typeof data.symbol === 'string' &&
      typeof data.name === 'string' &&
      typeof data.type === 'string' &&
      typeof data.price === 'number' &&
      typeof data.change === 'number' &&
      typeof data.changePercent === 'number' &&
      typeof data.priceInBTC === 'number' &&
      typeof data.priceInUSD === 'number' &&
      typeof data.lastUpdated === 'string';
  }
}

// Export an instance of the service with default dependencies
const secureMarketDataService = new SecureMarketDataService();
export default secureMarketDataService;

// Also export the class for potential extension
export { SecureMarketDataService };