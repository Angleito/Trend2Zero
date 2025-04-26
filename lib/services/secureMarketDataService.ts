import {
  MarketAsset,
  AssetPrice,
  AssetCategory,
  MarketOverview,
  HistoricalDataPoint
} from '../types';
// import { getCachedData } from '../cache'; // Remove static import
import coinGeckoService from './coinGeckoService';
import coinMarketCapService from './coinMarketCapService';
import metalPriceService from './metalPriceService';
import { Logger } from 'winston'; // Import Logger type

// Predefined list of assets with correct type casing and all required properties
const predefinedAssets: MarketAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'Cryptocurrency',
    price: 70000,
    change: 1500,
    changePercent: 2.2,
    priceInBTC: 1,
    priceInUSD: 70000,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'Cryptocurrency',
    price: 3500,
    change: 100,
    changePercent: 2.9,
    priceInBTC: 0.05,
    priceInUSD: 3500,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'Stocks',
    price: 170,
    change: -2,
    changePercent: -1.2,
    priceInBTC: 0,
    priceInUSD: 170,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'Stocks',
    price: 150,
    change: 3,
    changePercent: 2.0,
    priceInBTC: 0,
    priceInUSD: 150,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'XAU',
    name: 'Gold',
    type: 'PreciousMetal', // Use 'PreciousMetal' key from updated types
    price: 2300,
    change: 10,
    changePercent: 0.4,
    priceInBTC: 0,
    priceInUSD: 2300,
    lastUpdated: new Date().toISOString()
  }
];

interface MarketDataServiceDependencies {
  logger: Logger; // Require a Logger instance
  coinGeckoService?: typeof coinGeckoService;
  coinMarketCapService?: typeof coinMarketCapService;
  metalPriceService?: typeof metalPriceService;
}

class SecureMarketDataService {
  private coinGeckoService: typeof coinGeckoService;
  private coinMarketCapService: typeof coinMarketCapService;
  private metalPriceService: typeof metalPriceService;
  private coinMarketCapRateLimited: boolean = false;
  private logger: Logger;
  private useMockData: boolean; // Added useMockData property

  constructor(deps: MarketDataServiceDependencies) {
    this.logger = deps.logger;
    this.coinGeckoService = deps.coinGeckoService || coinGeckoService;
    this.coinMarketCapService = deps.coinMarketCapService || coinMarketCapService;
    this.metalPriceService = deps.metalPriceService || metalPriceService;
    this.useMockData = process.env.USE_MOCK_DATA === 'true'; // Initialize useMockData
    this.logger.info(`[SecureMarketDataService] Initialized. useMockData: ${this.useMockData}`);
  }

  /**
   * List available assets, filtered by category and/or keywords, paginated.
   * This method might still rely on a static list or a less frequent update
   * depending on the nature of "available assets" vs "real-time market data".
   * Keeping it as is for now, assuming it's for a static list or less frequent updates.
   */
  public async listAvailableAssets(options: {
    page?: number;
    pageSize?: number;
    category?: string;
    keywords?: string;
  } = {}): Promise<MarketAsset[]> {
    let results = predefinedAssets;
    if (options.category) {
      results = results.filter(asset => asset.type === options.category);
    }
    if (options.keywords) {
      const kw = options.keywords.toLowerCase();
      results = results.filter(asset =>
        asset.symbol.toLowerCase().includes(kw) ||
        (asset.name && asset.name.toLowerCase().includes(kw))
      );
    }
    // Pagination
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return results.slice(start, end);
  }

  /**
   * Get market overview data with caching.
   */
  async getMarketOverview(): Promise<MarketOverview | null> {
    if (this.useMockData) { // Check useMockData flag
      this.logger.info('[SecureMarketData] Using mock data for market overview');
      return this.generateMockMarketOverview();
    }

    const cacheKey = 'market-overview';
    this.logger.info(`[SecureMarketData] Attempting to get market overview from cache with key: ${cacheKey}`);

    // Use caching only on the server side
    if (typeof window === 'undefined') {
      try {
        const { getCachedData } = await import('../cache'); // Dynamic import
        const cachedData = await getCachedData<MarketOverview | null>(cacheKey, async () => {
          this.logger.info(`[SecureMarketData] Cache miss for key: ${cacheKey}. Fetching from external services.`);
          try {
            this.logger.info('[SecureMarketData] Attempting to fetch popular assets from CoinGecko for market overview');
            const [popularAssets, indices] = await Promise.all([
              this.getPopularAssets(), // This method will also use caching
              Promise.resolve([]) // Assuming indices are not yet integrated with real-time APIs
            ]);
            this.logger.info('[SecureMarketData] Successfully fetched popular assets for market overview.');

            // Get top movers from popular assets
            const topMovers = popularAssets
              .sort((a: MarketAsset, b: MarketAsset) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
              .slice(0, 5)
              .map((asset: MarketAsset) => ({
                Symbol: asset.symbol.toUpperCase(),
                Name: asset.name,
                Price: asset.price,
                Change: asset.change,
                ChangePercent: asset.changePercent
              }));

            const marketOverview: MarketOverview = {
              marketStatus: 'open', // This might need to be determined from API data
              lastUpdated: new Date().toISOString(),
              marketSummary: this.generateMarketSummary(popularAssets),
              indices,
              topMovers
            };

            this.logger.info('[SecureMarketData] Successfully generated market overview.');
            return marketOverview;
          } catch (error) {
            this.logger.error('[SecureMarketData] Error during fetch:', error);
            throw error; // Rethrow to allow getCachedData to handle fallback
          }
        }, 60 * 5); // 5 minutes TTL in seconds
        return cachedData;
      } catch (error) {
        this.logger.error('[SecureMarketData] Error accessing cache on server:', error);
        // Fallback to fetching directly if caching fails on server
        this.logger.warn('[SecureMarketData] Falling back to direct fetch on server.');
        return this.fetchMarketOverviewDirectly();
      }
    } else {
      // On the client side, fetch directly without caching logic here
      this.logger.info('[SecureMarketData] Running on client, fetching market overview directly.');
      return this.fetchMarketOverviewDirectly();
    }
  }

  // Helper method to fetch market overview data directly (without caching)
  private async fetchMarketOverviewDirectly(): Promise<MarketOverview | null> {
     try {
        const [popularAssets, indices] = await Promise.all([
            this.getPopularAssets(), // This method will also use caching
            Promise.resolve([]) // Assuming indices are not yet integrated with real-time APIs
        ]);

        const topMovers = popularAssets
            .sort((a: MarketAsset, b: MarketAsset) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 5)
            .map((asset: MarketAsset) => ({
                Symbol: asset.symbol.toUpperCase(),
                Name: asset.name,
                Price: asset.price,
                Change: asset.change,
                ChangePercent: asset.changePercent
            }));

        const marketOverview: MarketOverview = {
            marketStatus: 'open', // This might need to be determined from API data
            lastUpdated: new Date().toISOString(),
            marketSummary: this.generateMarketSummary(popularAssets),
            indices,
            topMovers
        };
        return marketOverview;
     } catch (error) {
        this.logger.error('[SecureMarketData] Error fetching market overview directly:', error);
        return null;
     }
  }


  /**
   * Get popular assets with caching.
   */
  async getPopularAssets(): Promise<MarketAsset[]> {
    if (this.useMockData) { // Check useMockData flag
      this.logger.info('[SecureMarketData] Using mock data for popular assets');
      return this.generateMockPopularAssets();
    }

    const cacheKey = 'popular-assets';
    this.logger.info(`[SecureMarketData] Attempting to get popular assets from cache with key: ${cacheKey}`);

    // Use caching only on the server side
    if (typeof window === 'undefined') {
      try {
         const { getCachedData } = await import('../cache'); // Dynamic import
         const cachedData = await getCachedData<MarketAsset[]>(cacheKey, async () => {
            this.logger.info(`[SecureMarketData] Cache miss for key: ${cacheKey}. Fetching from CoinGecko.`);
            try {
              this.logger.info('[SecureMarketData] Calling coinGeckoService.getTopAssets()');
              const popularAssets = await this.coinGeckoService.getTopAssets();
              this.logger.info('[SecureMarketData] Successfully fetched popular assets from CoinGecko.');
              return popularAssets;
            } catch (error) {
              this.logger.error('[SecureMarketData] Error getting popular assets from CoinGecko:', error);
              throw error; // Rethrow to allow getCachedData to handle fallback
            }
         }, 60 * 5); // 5 minutes TTL in seconds
         return cachedData;
      } catch (error) {
         this.logger.error('[SecureMarketData] Error accessing cache on server for popular assets:', error);
         // Fallback to fetching directly if caching fails on server
         this.logger.warn('[SecureMarketData] Falling back to direct fetch for popular assets on server.');
         return this.fetchPopularAssetsDirectly();
      }
    } else {
      // On the client side, fetch directly without caching logic here
      this.logger.info('[SecureMarketData] Running on client, fetching popular assets directly.');
      return this.fetchPopularAssetsDirectly();
    }
  }

  // Helper method to fetch popular assets directly (without caching)
  private async fetchPopularAssetsDirectly(): Promise<MarketAsset[]> {
     try {
        const popularAssets = await this.coinGeckoService.getTopAssets();
        return popularAssets;
     } catch (error) {
        this.logger.error('[SecureMarketData] Error fetching popular assets directly:', error);
        return [];
     }
  }


  /**
   * Get asset price by symbol with caching and load balancing.
   */
  async getAssetPrice(symbol: string): Promise<AssetPrice | null> {
    if (this.useMockData) { // Check useMockData flag
      this.logger.info(`[SecureMarketData] Using mock data for asset price for ${symbol}`);
      const mockAsset = predefinedAssets.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase());
      if (mockAsset) {
        return {
          ...mockAsset,
          lastUpdated: new Date().toISOString() // Update timestamp
        };
      }
      // Return a default mock if the asset is not in predefinedAssets
      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        type: 'Unknown',
        price: Math.random() * 1000, // Random price
        change: (Math.random() - 0.5) * 100, // Random change
        changePercent: (Math.random() - 0.5) * 5, // Random change percent
        priceInBTC: 0,
        priceInUSD: Math.random() * 1000, // Random price in USD
        lastUpdated: new Date().toISOString()
      };
    }

    const cacheKey = `asset-price-${symbol.toLowerCase()}`;
    this.logger.info(`[SecureMarketData] Attempting to get asset price for ${symbol} from cache with key: ${cacheKey}`);

    // Use caching only on the server side
    if (typeof window === 'undefined') {
      try {
         const { getCachedData } = await import('../cache'); // Dynamic import
         const cachedData = await getCachedData<AssetPrice | null>(cacheKey, async () => {
            this.logger.info(`[SecureMarketData] Cache miss for key: ${cacheKey}. Fetching asset price for ${symbol}.`);
            try {
              this.logger.info(`[SecureMarketData] Fetching asset price for ${symbol}`);

              // Predefined mock data for consistent fallback (This will now only be used if API calls fail)
              const mockData: AssetPrice = {
                symbol: symbol,
                name: symbol.toUpperCase(), // Fallback name
                price: 0,
                priceInUSD: 0,
                change: 0,
                changePercent: 0,
                priceInBTC: 0,
                lastUpdated: new Date().toISOString(),
                type: 'Unknown' // Fallback type
              };

              let assetPrice: AssetPrice | null = null;

              // If CoinMarketCap is rate limited, go directly to CoinGecko
              if (this.coinMarketCapRateLimited) {
                this.logger.warn('[SecureMarketData] CoinMarketCap is rate limited. Trying CoinGecko.');
                try {
                  assetPrice = await this.coinGeckoService.getCryptoPrice(symbol);
                  this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinGecko.`);
                } catch (geckoError) {
                  this.logger.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol}:`, geckoError);
                }
              } else {
                try {
                  this.logger.info('[SecureMarketData] Trying CoinMarketCap first.');
                  // Try CoinMarketCap first if not rate limited
                  assetPrice = await this.coinMarketCapService.getAssetPrice(symbol);
                  this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinMarketCap.`);
                } catch (error) {
                  this.logger.warn(`[SecureMarketData] CoinMarketCap price fetch failed for ${symbol}:`, error);

                  // Mark CoinMarketCap as rate limited and try CoinGecko
                  this.coinMarketCapRateLimited = true;
                  this.logger.warn('[SecureMarketData] Marking CoinMarketCap as rate limited. Trying CoinGecko.');

                  try {
                    assetPrice = await this.coinGeckoService.getCryptoPrice(symbol);
                    this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinGecko after CoinMarketCap failure.`);
                  } catch (geckoError) {
                    this.logger.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol} after CoinMarketCap failure:`, geckoError);
                  }
                }
              }

              return assetPrice || mockData; // Return fetched data or mock data as fallback

            } catch (error) {
              this.logger.error(`[SecureMarketData] Critical error fetching asset price for ${symbol}:`, error);
              throw error; // Rethrow to allow getCachedData to handle fallback
            }
         }, 60); // 1 minute TTL in seconds for price
         return cachedData;
      } catch (error) {
         this.logger.error('[SecureMarketData] Error accessing cache on server for asset price:', error);
         // Fallback to fetching directly if caching fails on server
         this.logger.warn('[SecureMarketData] Falling back to direct fetch for asset price on server.');
         return this.fetchAssetPriceDirectly(symbol);
      }
    } else {
      // On the client side, fetch directly without caching logic here
      this.logger.info('[SecureMarketData] Running on client, fetching asset price directly.');
      return this.fetchAssetPriceDirectly(symbol);
    }
  }

  // Helper method to fetch asset price directly (without caching)
  private async fetchAssetPriceDirectly(symbol: string): Promise<AssetPrice | null> {
     try {
        // Predefined mock data for consistent fallback (This will now only be used if API calls fail)
        const mockData: AssetPrice = {
          symbol: symbol,
          name: symbol.toUpperCase(), // Fallback name
          price: 0,
          priceInUSD: 0,
          change: 0,
          changePercent: 0,
          priceInBTC: 0,
          lastUpdated: new Date().toISOString(),
          type: 'Unknown' // Fallback type
        };

        let assetPrice: AssetPrice | null = null;

        // If CoinMarketCap is rate limited, go directly to CoinGecko
        if (this.coinMarketCapRateLimited) {
          this.logger.warn('[SecureMarketData] CoinMarketCap is rate limited. Trying CoinGecko.');
          try {
            assetPrice = await this.coinGeckoService.getCryptoPrice(symbol);
            this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinGecko.`);
          } catch (geckoError) {
            this.logger.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol}:`, geckoError);
          }
        } else {
          try {
            this.logger.info('[SecureMarketData] Trying CoinMarketCap first.');
            // Try CoinMarketCap first if not rate limited
            assetPrice = await this.coinMarketCapService.getAssetPrice(symbol);
            this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinMarketCap.`);
          } catch (error) {
            this.logger.warn(`[SecureMarketData] CoinMarketCap price fetch failed for ${symbol}:`, error);

            // Mark CoinMarketCap as rate limited and try CoinGecko
            this.coinMarketCapRateLimited = true;
            this.logger.warn('[SecureMarketData] Marking CoinMarketCap as rate limited. Trying CoinGecko.');

            try {
              assetPrice = await this.coinGeckoService.getCryptoPrice(symbol);
              this.logger.info(`[SecureMarketData] Successfully fetched asset price for ${symbol} from CoinGecko after CoinMarketCap failure.`);
            } catch (geckoError) {
              this.logger.warn(`[SecureMarketData] CoinGecko price fetch failed for ${symbol} after CoinMarketCap failure:`, geckoError);
            }
          }
        }

        return assetPrice || mockData; // Return fetched data or mock data as fallback

     } catch (error) {
        this.logger.error(`[SecureMarketData] Critical error fetching asset price for ${symbol} directly:`, error);
        return null;
     }
  }


  /**
   * Get historical data with caching.
   */
  async getHistoricalData(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
    if (this.useMockData) { // Check useMockData flag
      this.logger.info(`[SecureMarketData] Using mock data for historical data for ${symbol} (${days} days)`);
      // Return empty array for mock historical data
      return [];
    }

    const cacheKey = `historical-data-${symbol.toLowerCase()}-${days}`;
    this.logger.info(`[SecureMarketData] Attempting to get historical data for ${symbol} (${days} days) from cache with key: ${cacheKey}`);

    // Use caching only on the server side
    if (typeof window === 'undefined') {
      try {
         const { getCachedData } = await import('../cache'); // Dynamic import
         const cachedData = await getCachedData<HistoricalDataPoint[]>(cacheKey, async () => {
            this.logger.info(`[SecureMarketData] Cache miss for key: ${cacheKey}. Fetching historical data for ${symbol} (${days} days).`);
            try {
              this.logger.info(`[SecureMarketData] Calling coinGeckoService.getHistoricalData for ${symbol} (${days} days)`);
              // Currently only fetching from CoinGecko based on the original MarketDataService
              const historicalData = await this.coinGeckoService.getHistoricalData(symbol, days);
              this.logger.info(`[SecureMarketData] Successfully fetched historical data for ${symbol} (${days} days) from CoinGecko.`);
              return historicalData;
            } catch (error) {
              this.logger.error(`[SecureMarketData] Error fetching historical data for ${symbol}:`, error);
              throw error; // Rethrow to allow getCachedData to handle fallback
            }
         }, 60 * 60); // 1 hour TTL in seconds
         return cachedData;
      } catch (error) {
         this.logger.error('[SecureMarketData] Error accessing cache on server for historical data:', error);
         // Fallback to fetching directly if caching fails on server
         this.logger.warn('[SecureMarketData] Falling back to direct fetch for historical data on server.');
         return this.fetchHistoricalDataDirectly(symbol, days);
      }
    } else {
      // On the client side, fetch directly without caching logic here
      this.logger.info('[SecureMarketData] Running on client, fetching historical data directly.');
      return this.fetchHistoricalDataDirectly(symbol, days);
    }
  }

  // Helper method to fetch historical data directly (without caching)
  private async fetchHistoricalDataDirectly(symbol: string, days: number): Promise<HistoricalDataPoint[]> {
     try {
        const historicalData = await this.coinGeckoService.getHistoricalData(symbol, days);
        return historicalData;
     } catch (error) {
        this.logger.error(`[SecureMarketData] Error fetching historical data for ${symbol} directly:`, error);
        return [];
     }
  }


  /**
   * Search assets with caching.
   */
  async searchAssets(query: string, limit: number = 10): Promise<MarketAsset[]> {
    if (this.useMockData) { // Check useMockData flag
      this.logger.info(`[SecureMarketData] Using mock data for searching assets for query "${query}"`);
      const lowerQuery = query.toLowerCase();
      // Filter predefinedAssets based on query
      return predefinedAssets.filter(asset =>
        asset.symbol.toLowerCase().includes(lowerQuery) ||
        (asset.name && asset.name.toLowerCase().includes(lowerQuery))
      ).slice(0, limit); // Apply limit
    }

    const cacheKey = `search-assets-${query.toLowerCase()}-${limit}`;
    this.logger.info(`[SecureMarketData] Attempting to search assets for query "${query}" from cache with key: ${cacheKey}`);

    // Use caching only on the server side
    if (typeof window === 'undefined') {
      try {
         const { getCachedData } = await import('../cache'); // Dynamic import
         const cachedData = await getCachedData<MarketAsset[]>(cacheKey, async () => {
            this.logger.info(`[SecureMarketData] Cache miss for key: ${cacheKey}. Searching assets for query "${query}".`);
            try {
              this.logger.info(`[SecureMarketData] Calling coinGeckoService.searchAssets for query "${query}"`);
              // Currently only searching CoinGecko based on the original MarketDataService
              const searchResults = await this.coinGeckoService.searchAssets(query, limit);
              this.logger.info(`[SecureMarketData] Successfully searched assets for query "${query}" from CoinGecko.`);
              return searchResults;
            } catch (error) {
              this.logger.error(`[SecureMarketData] Error searching assets for query "${query}":`, error);
              throw error; // Rethrow to allow getCachedData to handle fallback
            }
         }, 60 * 60); // 1 hour TTL in seconds
         return cachedData;
      } catch (error) {
         this.logger.error('[SecureMarketData] Error accessing cache on server for search assets:', error);
         // Fallback to searching directly if caching fails on server
         this.logger.warn('[SecureMarketData] Falling back to direct search for assets on server.');
         return this.searchAssetsDirectly(query, limit);
      }
    } else {
      // On the client side, search directly without caching logic here
      this.logger.info('[SecureMarketData] Running on client, searching assets directly.');
      return this.searchAssetsDirectly(query, limit);
    }
  }

  // Helper method to search assets directly (without caching)
  private async searchAssetsDirectly(query: string, limit: number = 10): Promise<MarketAsset[]> {
     try {
        const searchResults = await this.coinGeckoService.searchAssets(query, limit);
        return searchResults;
     } catch (error) {
        this.logger.error(`[SecureMarketData] Error searching assets for query "${query}" directly:`, error);
        return [];
     }
  }


  private generateMarketSummary(assets: MarketAsset[]): string {
    const positiveCount = assets.filter((a: MarketAsset) => a.changePercent > 0).length;
    const totalAssets = assets.length;
    if (totalAssets === 0) return 'Market data not available.';
    const averageChange = assets.reduce((sum: number, asset: MarketAsset) => sum + (asset.changePercent || 0), 0) / totalAssets;

    if (averageChange > 2) {
      return 'Market showing strong bullish momentum with significant gains';
    } else if (averageChange > 0) {
      return 'Market trending slightly upward with moderate gains';
    } else if (averageChange > -2) {
      return 'Market showing mixed signals with moderate volatility';
    } else {
      return 'Market experiencing downward pressure with notable losses';
    }
  }

  // New method to generate mock market overview data
  private generateMockMarketOverview(): MarketOverview {
    const mockAssets = this.generateMockPopularAssets();
    const topMovers = mockAssets
      .sort((a: MarketAsset, b: MarketAsset) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 5)
      .map((asset: MarketAsset) => ({
        Symbol: asset.symbol.toUpperCase(),
        Name: asset.name,
        Price: asset.price,
        Change: asset.change,
        ChangePercent: asset.changePercent
      }));

    return {
      marketStatus: 'open',
      lastUpdated: new Date().toISOString(),
      marketSummary: this.generateMarketSummary(mockAssets),
      indices: [ // Mock indices data
        { Name: 'S&P 500', Value: 5200, Change: 50 },
        { Name: 'NASDAQ', Value: 16500, Change: 150 }
      ],
      topMovers: topMovers
    };
  }

  // New method to generate mock popular assets data
  private generateMockPopularAssets(): MarketAsset[] {
    // Return a subset of predefinedAssets with some mock values
    return predefinedAssets.map(asset => ({
      ...asset,
      price: asset.price > 0 ? asset.price * (1 + (Math.random() - 0.5) * 0.1) : Math.random() * 1000, // Simulate some price fluctuation
      change: asset.change > 0 ? asset.change * (1 + (Math.random() - 0.5) * 0.2) : asset.change * (1 + (Math.random() - 0.5) * 0.2), // Simulate some change fluctuation
      changePercent: asset.changePercent > 0 ? asset.changePercent * (1 + (Math.random() - 0.5) * 0.2) : asset.changePercent * (1 + (Math.random() - 0.5) * 0.2), // Simulate some change percent fluctuation
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Type guard for rate limit error (handles both Axios and test mock errors)
   */
  private isRateLimitError(error: any): boolean { // Changed type to any for simpler check
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response === 'object' &&
      (error as any).response !== null &&
      'status' in (error as any).response &&
      (error as any).response.status === 429
    );
  }
}

// Export the default instance for compatibility
// Assuming a logger instance is available elsewhere and passed in during initialization
// For now, exporting the class and expecting the consumer to provide dependencies
// const defaultLogger: any = console; // Remove console fallback
// const secureMarketDataService = new SecureMarketDataService({ logger: defaultLogger });
// export default secureMarketDataService;

// Export the class for dependency injection
export { SecureMarketDataService };