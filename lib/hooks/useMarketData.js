import { useState, useEffect, useCallback, useMemo } from 'react';
import { createDefaultAsset, parseAssetCategory } from '@/lib/types';

function useMarketData(options = {}) {
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

            const response = await fetch(`/api/market-data/search?q=${encodeURIComponent(query)}&limit=${memoizedOptions.limit}`);
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

    // Fetch historical data for an asset
    const fetchHistoricalData = useCallback(async (assetSymbol) => {
        if (!assetSymbol) return;
        try {
            const response = await fetch(`/api/market-data/historical/${encodeURIComponent(assetSymbol)}`);
            const data = await response.json();
            
            if (response.ok) {
                setMarketData(prev => ({
                    ...prev,
                    historicalData: data
                }));
            } else {
                throw new Error(data.error || 'Failed to fetch historical data');
            }
        } catch (err) {
            console.error(`[useMarketData] Error fetching historical data:`, err);
            setMarketData(prev => ({
                ...prev,
                historicalData: null,
                error: err instanceof Error ? err.message : 'Failed to fetch historical data'
            }));
        }
    }, []);

    // Fetch asset by symbol
    const fetchAssetBySymbol = useCallback(async (assetSymbol) => {
        if (!assetSymbol) return;
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch(`/api/market-data/asset/${encodeURIComponent(assetSymbol)}`);
            const data = await response.json();

            if (response.ok) {
                setMarketData(prev => ({
                    ...prev,
                    asset: data,
                    price: data.price,
                    loading: false
                }));

                // Fetch historical data after getting the asset
                await fetchHistoricalData(assetSymbol);
            } else {
                throw new Error(data.error || `Failed to fetch data for ${assetSymbol}`);
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

    // Fetch market data (popular or by type)
    const fetchMarketData = useCallback(async () => {
        console.log('[useMarketData] Fetching market data (popular/by type) from API');
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));

            let endpoint = memoizedOptions.type
                ? `/api/market-data/assets?type=${encodeURIComponent(memoizedOptions.type)}&limit=${memoizedOptions.limit}`
                : `/api/market-data/popular?limit=${memoizedOptions.limit}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to fetch market data for ${memoizedOptions.type || 'popular'}`);
            }

            const assetsToDisplay = data.assets || data;
            setMarketData(prev => ({
                ...prev,
                assets: assetsToDisplay || [],
                popularAssets: memoizedOptions.type ? prev.popularAssets : assetsToDisplay || [],
                loading: false,
                error: null
            }));

            // Optionally fetch historical data for the first asset if available
            if (assetsToDisplay.length > 0) {
                await fetchHistoricalData(assetsToDisplay[0].symbol);
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
    }, [memoizedOptions.type, memoizedOptions.limit, fetchHistoricalData]);

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
            loading: true
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
                if (memoizedOptions.searchQuery) {
                    return searchAssets(memoizedOptions.searchQuery);
                } else if (memoizedOptions.symbol) {
                    return fetchAssetBySymbol(memoizedOptions.symbol);
                } else {
                    return fetchMarketData();
                }
            }
        }));
    }, [fetchMarketData, fetchAssetBySymbol, searchAssets, memoizedOptions]);

    return {
        ...marketData,
        search: searchAssets
    };
}

export function usePopularAssets(limit = 10) {
    return useMarketData({ limit });
}

export function useAssetsByType(type, limit = 20) {
    return useMarketData({ type, limit });
}

export function useAssetSearch() {
    const { search, searchResults, loading, error } = useMarketData();
    return { search, searchResults, loading, error };
}

export default {
    useMarketData,
    usePopularAssets,
    useAssetsByType,
    useAssetSearch
};
