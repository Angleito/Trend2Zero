import { useState, useEffect, useCallback, useMemo } from 'react';
import * as marketDataService from '../api/marketDataService';
import { 
  MarketData, 
  MarketDataOptions, 
  createDefaultAsset, 
  HistoricalDataPoint, 
  AssetData,
  MarketAsset,
  AssetPrice,
  AssetCategory
} from '../types';
import MongoDbCacheService from '../services/mongoDbCacheService';

// Type guard to check if data is FallbackData
function isFallbackData(data: any): data is { data: any, isCached: boolean } {
  return data && typeof data === 'object' && 'data' in data && 'isCached' in data;
}

// Initialize MongoDB cache service lazily
let mongoDbCache: MongoDbCacheService | null = null;
if (typeof window !== 'undefined') {
  mongoDbCache = new MongoDbCacheService();
  console.log('[useMarketData] Initialized MongoDB cache on client-side');
}

export function useMarketData(options: MarketDataOptions = {}): MarketData {
  const {
    symbol = null,
    type = null,
    searchQuery = null,
    autoRefresh = false,
    refreshInterval = 60000,
    limit = 10
  } = options;

  const [marketData, setMarketData] = useState<MarketData>({
    asset: null,
    price: null,
    historicalData: null,
    popularAssets: [],
    searchResults: [],
    loading: true,
    error: null,
    refetch: () => {},
    assets: [] // Added to match the usage in page.tsx
  });

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => ({
    symbol,
    type,
    searchQuery,
    limit
  }), [symbol, type, searchQuery, limit]);

  /**
   * Safe execute MongoDB operations with SSR handling
   */
  const safeExecuteMongo = async <T,>(
    operation: () => Promise<T>,
    fallbackData?: any
  ): Promise<T | null> => {
    if (typeof window === 'undefined') {
      console.log('[useMarketData] Skipping MongoDB operation on server-side');
      return fallbackData || null;
    }

    if (!mongoDbCache) {
      console.log('[useMarketData] MongoDB cache not initialized');
      return fallbackData || null;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('[useMarketData] MongoDB operation failed:', error);
      return fallbackData || null;
    }
  };

  /**
   * Fetch historical data with MongoDB caching integration
   */
  const fetchHistoricalData = useCallback(async (assetSymbol: string, days: number = 30) => {
    console.log(`[useMarketData] Fetching historical data for ${assetSymbol} over ${days} days`);
    
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));
      
      const cachedHistoricalData = await safeExecuteMongo(
        async () => mongoDbCache?.getCachedHistoricalData(assetSymbol, days),
        null
      );
      
      if (cachedHistoricalData) {
        console.log(`[useMarketData] Using cached historical data for ${assetSymbol}`);
        const historicalData = isFallbackData(cachedHistoricalData) 
          ? cachedHistoricalData.data 
          : cachedHistoricalData;

        setMarketData(prev => ({
          ...prev,
          historicalData,
          loading: false
        }));
        return;
      }
      
      const response = await marketDataService.getAssetHistory(assetSymbol, { days });
      
      if (response) {
        if (mongoDbCache) {
          await mongoDbCache.cacheHistoricalData(assetSymbol, days, response);
        }
        
        setMarketData(prev => ({
          ...prev,
          historicalData: response,
          loading: false
        }));
      }
    } catch (err: any) {
      console.error(`[useMarketData] Error fetching historical data for ${assetSymbol}:`, err);
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch historical data'
      }));
    }
  }, []);

  /**
   * Search for assets with MongoDB caching integration
   */
  const searchAssets = useCallback(async (query: string) => {
    if (!query || query.trim() === '') {
      setMarketData(prev => ({
        ...prev,
        searchResults: [],
        loading: false
      }));
      return;
    }
    
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));
      
      const cachedSearchResults = await safeExecuteMongo(
        async () => mongoDbCache?.getCachedAssetList(`search-${query.toLowerCase()}`, 1, memoizedOptions.limit),
        null
      );
      
      if (cachedSearchResults) {
        const searchResults = isFallbackData(cachedSearchResults) 
          ? cachedSearchResults.data 
          : cachedSearchResults;

        setMarketData(prev => ({
          ...prev,
          searchResults: searchResults || [],
          assets: searchResults || [], // Added to match the usage in page.tsx
          loading: false
        }));
        return;
      }
      
      const response = await marketDataService.searchAssets(query, 'cryptocurrency', memoizedOptions.limit);
      
      if (response?.assets) {
        if (mongoDbCache) {
          await mongoDbCache.cacheAssetList(
            `search-${query.toLowerCase()}`, 
            1, 
            memoizedOptions.limit, 
            {
              data: response.assets,
              pagination: response.total ? { totalItems: response.total } : {}
            }
          );
        }
        
        setMarketData(prev => ({
          ...prev,
          searchResults: response.assets,
          loading: false
        }));
      }
    } catch (err: any) {
      console.error(`[useMarketData] Error searching for assets:`, err);
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to search for assets',
        assets: [] // Ensure assets is reset on error
      }));
    }
  }, [memoizedOptions.limit]);

  /**
   * Fetch asset details by symbol with MongoDB caching
   */
  const fetchAssetBySymbol = useCallback(async (assetSymbol: string) => {
    if (!assetSymbol) return;
    
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));
      
      const cachedPrice = await safeExecuteMongo(
        async () => mongoDbCache?.getCachedAssetPrice(assetSymbol),
        null
      );
      
      let price: AssetPrice | null = null;
      let asset = null;
      
      if (cachedPrice) {
        price = isFallbackData(cachedPrice) ? cachedPrice.data : cachedPrice;
      } else {
        try {
          const priceResponse = await marketDataService.getAssetPrice(assetSymbol);
          if (priceResponse) {
            price = priceResponse as AssetPrice;
            if (mongoDbCache) {
              await mongoDbCache.cacheAssetPrice(assetSymbol, {
                id: assetSymbol,
                symbol: assetSymbol,
                name: assetSymbol,
                type: 'cryptocurrency' as AssetCategory,
                price: price.price,
                change: price.change,
                changePercent: price.changePercent,
                priceInBTC: price.priceInBTC,
                priceInUSD: price.priceInUSD,
                lastUpdated: price.lastUpdated
              });
            }
          }
        } catch (err) {
          console.error(`[useMarketData] Error fetching price for ${assetSymbol}:`, err);
        }
      }
      
      try {
        const response = await marketDataService.getAssetBySymbol(assetSymbol);
        asset = response || null;
      } catch (err) {
        console.error(`[useMarketData] Error fetching details for ${assetSymbol}:`, err);
      }
      
      setMarketData(prev => ({
        ...prev,
        asset: asset ? createDefaultAsset(asset) : null,
        price: price?.price || null,
        loading: false,
        error: !asset && !price ? `Failed to fetch data for ${assetSymbol}` : null
      }));
      
      if (asset || price) {
        fetchHistoricalData(assetSymbol);
      }
      
    } catch (err: any) {
      console.error(`[useMarketData] Error fetching asset by symbol ${assetSymbol}:`, err);
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: err.message || `Failed to fetch data for ${assetSymbol}`
      }));
    }
  }, [fetchHistoricalData]);

  const fetchMarketData = useCallback(async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));

      let popularAssets: MarketAsset[] = [];
      let typeAssets: MarketAsset[] = [];

      const cachedPopularAssets = await safeExecuteMongo(
        async () => mongoDbCache?.getCachedAssetList('popular', 1, memoizedOptions.limit),
        null
      );
      
      if (cachedPopularAssets) {
        popularAssets = isFallbackData(cachedPopularAssets) 
          ? cachedPopularAssets.data 
          : cachedPopularAssets;
      } else {
        try {
          const response = await marketDataService.getPopularAssets(memoizedOptions.limit);
          popularAssets = response.assets || [];
          
          if (mongoDbCache && response.assets) {
            await mongoDbCache.cacheAssetList('popular', 1, memoizedOptions.limit, {
              data: popularAssets,
              pagination: response.total ? { totalItems: response.total } : {}
            });
          }
        } catch (err) {
          console.error('[useMarketData] Popular assets fetch error:', err);
        }
      }

      if (memoizedOptions.type) {
        const cachedTypeAssets = await safeExecuteMongo(
          async () => mongoDbCache?.getCachedAssetList(
            memoizedOptions.type!, 
            1, 
            memoizedOptions.limit
          ),
          null
        );
        
        if (cachedTypeAssets) {
          typeAssets = isFallbackData(cachedTypeAssets) 
            ? cachedTypeAssets.data 
            : cachedTypeAssets;
        } else {
          try {
            const response = await marketDataService.getAssetsByType(
              memoizedOptions.type, 
              memoizedOptions.limit
            );
            typeAssets = response.assets || [];
            
            if (mongoDbCache && response.assets) {
              await mongoDbCache.cacheAssetList(
                memoizedOptions.type, 
                1, 
                memoizedOptions.limit, 
                {
                  data: typeAssets,
                  pagination: response.total ? { totalItems: response.total } : {}
                }
              );
            }
          } catch (err) {
            console.error('[useMarketData] Assets by type fetch error:', err);
          }
        }
      }

      const assets = (typeAssets.length > 0) ? typeAssets : popularAssets;
      const defaultSymbol = assets.length > 0 ? assets[0].symbol : null;

      if (defaultSymbol) {
        let asset = null;
        let price: AssetPrice | null = null;
        
        const cachedPrice = await safeExecuteMongo(
          async () => mongoDbCache?.getCachedAssetPrice(defaultSymbol),
          null
        );
        
        if (cachedPrice) {
          price = isFallbackData(cachedPrice) ? cachedPrice.data : cachedPrice;
        } else {
          try {
            const response = await marketDataService.getAssetPrice(defaultSymbol);
            if (response) {
              price = response as AssetPrice;
              if (mongoDbCache) {
                await mongoDbCache.cacheAssetPrice(defaultSymbol, {
                  id: defaultSymbol,
                  symbol: defaultSymbol,
                  name: defaultSymbol,
                  type: 'cryptocurrency' as AssetCategory,
                  price: price.price,
                  change: price.change,
                  changePercent: price.changePercent,
                  priceInBTC: price.priceInBTC,
                  priceInUSD: price.priceInUSD,
                  lastUpdated: price.lastUpdated
                });
              }
            }
          } catch (err) {
            console.error('[useMarketData] Default price fetch error:', err);
          }
        }
        
        try {
          const response = await marketDataService.getAssetBySymbol(defaultSymbol);
          asset = response || null;
        } catch (err) {
          console.error('[useMarketData] Default asset fetch error:', err);
        }

        setMarketData(prev => ({
          ...prev,
          asset: asset ? createDefaultAsset(asset) : null,
          price: price?.price || null,
          popularAssets: assets || [],
          assets: assets || [], // Added to match the usage in page.tsx
          loading: false,
          error: !asset && !price ? 'Failed to fetch asset data' : null
        }));
        
        if (asset || price) {
          fetchHistoricalData(defaultSymbol);
        }
      } else {
        setMarketData(prev => ({
          ...prev,
          popularAssets: assets || [],
          assets: assets || [], // Ensure assets is synchronized with popularAssets
          loading: false,
          error: null
        }));
      }
    } catch (err: any) {
      console.error('[useMarketData] Unexpected error in market data fetch:', err);
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch market data',
        assets: [], // Ensure assets is reset on error
        popularAssets: [] // Also reset popularAssets
      }));
    }
  }, [memoizedOptions, fetchHistoricalData]);

  // Update effect to handle search query and symbol-specific fetches
  useEffect(() => {
    console.log('[useMarketData] Options change effect triggered', memoizedOptions);
    
    // Handle search query
    if (memoizedOptions.searchQuery) {
      console.log(`[useMarketData] Search query detected: ${memoizedOptions.searchQuery}`);
      searchAssets(memoizedOptions.searchQuery);
      return;
    }
    
    // Handle specific symbol
    if (memoizedOptions.symbol) {
      console.log(`[useMarketData] Symbol detected: ${memoizedOptions.symbol}`);
      fetchAssetBySymbol(memoizedOptions.symbol);
      return;
    }
    
    // Default fetch for other cases
    fetchMarketData();
    
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        if (memoizedOptions.searchQuery) {
          searchAssets(memoizedOptions.searchQuery);
        } else if (memoizedOptions.symbol) {
          fetchAssetBySymbol(memoizedOptions.symbol);
        } else {
          fetchMarketData();
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchMarketData, fetchAssetBySymbol, searchAssets, memoizedOptions, autoRefresh, refreshInterval]);

  // Update the refetch method in the state
  useEffect(() => {
    setMarketData(prev => ({
      ...prev,
      refetch: fetchMarketData
    }));
  }, [fetchMarketData]);

  return marketData;
}