import { useState, useEffect, useCallback, useMemo } from 'react';
import { createDefaultAsset, parseAssetCategory } from '../types';

export function useMarketData(options = {}) {
    const { symbol = null, type = null, searchQuery = null, autoRefresh = false, refreshInterval = 60000, limit = 10 } = options;

    // Memoize options to prevent unnecessary re-renders
    const memoizedOptions = useMemo(() => ({
        symbol,
        type: type ? parseAssetCategory(type) : undefined,
        searchQuery,
        limit
    }), [symbol, type, searchQuery, limit]);

    // State initialization with explicit typing
    const [marketData, setMarketData] = useState({
        price: null,
        historicalData: null,
        popularAssets: [],
        searchResults: [],
        loading: true,
        error: null,
        assets: [],
        refetch: () => Promise.resolve() // Provide a default no-op refetch
    });

    // Fetch historical data from API
    const fetchHistoricalData = useCallback(async (assetSymbol, days = 30) => {
        if (!assetSymbol) return;
        console.log(`[useMarketData] Fetching historical data for ${assetSymbol} over ${days} days from API`);
        try {
            setMarketData(prev => ({
                ...prev,
                loading: true,
                error: null
            }));

            const response = await fetch(`/api/market-data/historical/${assetSymbol}?days=${days}`);
            const data = await response.json();

            if (response.ok) {
                setMarketData(prev => ({
                    ...prev,
                    historicalData: data,
                    loading: false
                }));
            } else {
                 setMarketData(prev => ({
                    ...prev,
                    historicalData: [],
                    loading: false,
                    error: data.error || `Failed to fetch historical data for ${assetSymbol}`
                }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical data';
            console.error(`[useMarketData] Error fetching historical data for ${assetSymbol}:`, err);
            setMarketData(prev => ({
                ...prev,
                historicalData: [],
                loading: false,
                error: errorMessage
            }));
        }
    }, []);

    // Search for assets from API
    const searchAssets = useCallback(async (query) => {
        if (!query || query.trim() === '') {
            setMarketData(prev => ({
                ...prev,
                searchResults: [],
                assets: [],
                loading: false,
                error: null
            }));
            return;
        }
        console.log(`[useMarketData] Searching assets for "${query}" from API`);
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch(`/api/market-data/search?q=${query}&limit=${memoizedOptions.limit}`);
            const data = await response.json();

            if (response.ok) {
                setMarketData(prev => ({
                    ...prev,
                    searchResults: data,
                    assets: data,
                    loading: false
                }));
            } else {
                 setMarketData(prev => ({
                    ...prev,
                    searchResults: [],
                    assets: [],
                    loading: false,
                    error: data.error || `No assets found for "${query}"`
                }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search for assets';
            console.error(`[useMarketData] Error searching for assets:`, err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                searchResults: [],
                assets: []
            }));
        }
    }, [memoizedOptions.limit]);

    // Fetch asset details by symbol from API
    const fetchAssetBySymbol = useCallback(async (assetSymbol) => {
        if (!assetSymbol) return;
        console.log(`[useMarketData] Fetching asset data for symbol: ${assetSymbol} from API`);
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));

            // Fetch price
            const priceResponse = await fetch(`/api/market-data/price/${assetSymbol}`);
            const priceData = await priceResponse.json();
            const fetchedPrice = priceResponse.ok ? priceData : null;

            // Fetch asset details (if needed separately, otherwise price endpoint might return enough)
            // For now, assuming price endpoint returns enough details or we can construct a basic asset
            let asset = null;
            if (fetchedPrice) {
                 asset = createDefaultAsset(assetSymbol); // Create a basic asset object
                 // Optionally fetch more details if a dedicated endpoint exists and is needed
                 // const assetDetailsResponse = await fetch(`/api/market-data/assets?symbol=${assetSymbol}`);
                 // const assetDetailsData = await assetDetailsResponse.json();
                 // if (assetDetailsResponse.ok && assetDetailsData.assets && assetDetailsData.assets.length > 0) {
                 //     asset = assetDetailsData.assets[0];
                 // }
            }


            setMarketData(prev => ({
                ...prev,
                asset: asset,
                price: fetchedPrice?.price || null,
                loading: false,
                error: !asset && !fetchedPrice ? `Failed to fetch data for ${assetSymbol}` : null
            }));

            if (asset || fetchedPrice) {
                 await fetchHistoricalData(assetSymbol);
            } else {
                  setMarketData(prev => ({
                    ...prev,
                    historicalData: null
                }));
            }

        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : `Failed to fetch data for ${assetSymbol}`;
            console.error(`[useMarketData] Error fetching asset by symbol ${assetSymbol}:`, err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                asset: null,
                price: null,
                historicalData: null
            }));
        }
    }, [fetchHistoricalData]);

    // Fetch market data (popular or by type) from API
    const fetchMarketData = useCallback(async () => {
        console.log('[useMarketData] Fetching market data (popular/by type) from API');
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));

            let apiUrl = '/api/market-data/';
            if (memoizedOptions.type) {
                apiUrl += `assets?type=${memoizedOptions.type}&limit=${memoizedOptions.limit}`;
            } else {
                apiUrl += `popular?limit=${memoizedOptions.limit}`;
            }

            const response = await fetch(apiUrl);
            const data = await response.json();

            let assetsToDisplay = [];
            let error = null;

            if (response.ok) {
                assetsToDisplay = data.assets || data; // Handle both /assets and /popular response structures
            } else {
                error = data.error || `Failed to fetch market data for ${memoizedOptions.type || 'popular'}`;
            }

            setMarketData(prev => ({
                ...prev,
                assets: assetsToDisplay || [],
                popularAssets: memoizedOptions.type ? prev.popularAssets : assetsToDisplay || [],
                loading: false,
                error: error || (assetsToDisplay.length === 0 ? `No assets found for ${memoizedOptions.type || 'popular'}` : null)
            }));

            // Optionally fetch historical data for the first asset if available
            if (assetsToDisplay.length > 0) {
                 await fetchHistoricalData(assetsToDisplay[0].symbol);
            } else {
                  setMarketData(prev => ({
                    ...prev,
                    historicalData: null
                }));
            }

        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to fetch market data';
            console.error('[useMarketData] Unexpected error in market data fetch:', err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                assets: [],
                popularAssets: []
            }));
        }
    }, [memoizedOptions, fetchHistoricalData]);

    // Update effect to handle search query and symbol-specific fetches
    useEffect(() => {
        console.log('[useMarketData] Options change effect triggered', memoizedOptions);

        // Clear previous data when options change
        setMarketData(prev => ({
            ...prev,
            price: null,
            historicalData: null,
            searchResults: [],
            assets: [],
            error: null,
            loading: true // Set loading to true when starting a new fetch
        }));


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

        // Default fetch for other cases (popular or by type)
        fetchMarketData();

        let intervalId = null;
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
            refetch: () => {
                // Determine which fetch function to call based on current options
                if (memoizedOptions.searchQuery) {
                    return searchAssets(memoizedOptions.searchQuery);
                } else if (memoizedOptions.symbol) {
                    return fetchAssetBySymbol(memoizedOptions.symbol);
                } else {
                    return fetchMarketData();
                }
            }
        }));
    }, [fetchMarketData, fetchAssetBySymbol, searchAssets, memoizedOptions]); // Add dependencies

    return {
        ...marketData,
        search: searchAssets // Explicitly return searchAssets
    };
}

// Export individual hooks for specific use cases
export function usePopularAssets(limit = 10) {
    const { popularAssets, loading, error, refetch } = useMarketData({ limit });
    return { popularAssets, loading, error, refetch };
}

export function useAssetsByType(type, limit = 20) {
    const { assets, loading, error, refetch } = useMarketData({ type, limit });
    return { assets, loading, error, refetch };
}

export function useAssetSearch() {
    const { searchResults, loading, error, search } = useMarketData(); // Destructure search
    return { search, searchResults, loading, error };
}

export function useAssetPrice(symbol) {
    const { price, loading, error, refetch } = useMarketData({ symbol });
    return { price, loading, error, refetch };
}
