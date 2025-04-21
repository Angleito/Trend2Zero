import { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketDataService } from '../services/marketDataService';
import { createDefaultAsset, parseAssetCategory } from '../types';
import MongoDbCacheService from '../services/mongoDbCacheService';
// Create a single instance of MarketDataService
const marketDataService = new MarketDataService();
// Initialize MongoDB cache service lazily
let mongoDbCache = null;
if (typeof window !== 'undefined') {
    mongoDbCache = new MongoDbCacheService();
    console.log('[useMarketData] Initialized MongoDB cache on client-side');
}
// Type guard to check if data is FallbackData
function isFallbackData(data) {
    return data !== null &&
        typeof data === 'object' &&
        'data' in data &&
        'isCached' in data;
}
// Helper function to safely extract data
function extractData(data, defaultValue) {
    if (isFallbackData(data)) {
        return data.data;
    }
    return data || defaultValue;
}
export function useMarketData(options = {}) {
    const { symbol = null, type = null, searchQuery = null, autoRefresh = false, refreshInterval = 60000, limit = 10 } = options;
    // Memoize options to prevent unnecessary re-renders
    const memoizedOptions = useMemo(() => ({
        symbol,
        type: type ? parseAssetCategory(type) : undefined,
        searchQuery,
        limit
    }), [symbol, type, searchQuery, limit]);
    // Safe execute MongoDB operations with SSR handling
    const safeExecuteMongo = async (operation, fallbackData) => {
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
        }
        catch (error) {
            console.error('[useMarketData] MongoDB operation failed:', error);
            return fallbackData || null;
        }
    };
    // State initialization with explicit typing
    const [marketData, setMarketData] = useState({
        price: null,
        historicalData: null,
        popularAssets: [],
        searchResults: [],
        loading: true,
        error: null,
        assets: [],
        refetch: () => Promise.resolve()
    });
    // Fetch historical data with MongoDB caching integration
    const fetchHistoricalData = useCallback(async (assetSymbol, days = 30) => {
        console.log(`[useMarketData] Fetching historical data for ${assetSymbol} over ${days} days`);
        try {
            setMarketData(prev => ({
                ...prev,
                loading: true,
                error: null
            }));
            const cachedHistoricalData = await safeExecuteMongo(async () => mongoDbCache?.getCachedHistoricalData(assetSymbol, days), null);
            const historicalData = extractData(cachedHistoricalData, []);
            if (historicalData.length > 0) {
                console.log(`[useMarketData] Using cached historical data for ${assetSymbol}`);
                setMarketData(prev => ({
                    ...prev,
                    historicalData,
                    loading: false
                }));
                return;
            }
            const response = await marketDataService.getHistoricalData(assetSymbol, days);
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
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical data';
            console.error(`[useMarketData] Error fetching historical data for ${assetSymbol}:`, err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));
        }
    }, []);
    // Search for assets with MongoDB caching integration
    const searchAssets = useCallback(async (query) => {
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
            const cachedSearchResults = await safeExecuteMongo(async () => mongoDbCache?.getCachedAssetList(`search-${query.toLowerCase()}`, 1, memoizedOptions.limit), null);
            const searchResults = extractData(cachedSearchResults, []);
            if (searchResults.length > 0) {
                setMarketData(prev => ({
                    ...prev,
                    searchResults,
                    assets: searchResults,
                    loading: false
                }));
                return;
            }
            const response = await marketDataService.listAvailableAssets({
                keywords: query,
                category: 'cryptocurrency',
                pageSize: memoizedOptions.limit
            });
            if (response) {
                if (mongoDbCache) {
                    await mongoDbCache.cacheAssetList(`search-${query.toLowerCase()}`, 1, memoizedOptions.limit, {
                        data: response,
                        pagination: { totalItems: response.length }
                    });
                }
                setMarketData(prev => ({
                    ...prev,
                    searchResults: response,
                    loading: false
                }));
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search for assets';
            console.error(`[useMarketData] Error searching for assets:`, err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
                assets: []
            }));
        }
    }, [memoizedOptions.limit]);
    // Fetch asset details by symbol with MongoDB caching
    const fetchAssetBySymbol = useCallback(async (assetSymbol) => {
        if (!assetSymbol)
            return;
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));
            const cachedPrice = await safeExecuteMongo(async () => mongoDbCache?.getCachedAssetPrice(assetSymbol), null);
            const price = extractData(cachedPrice, {
                symbol: assetSymbol,
                price: 0,
                change: 0,
                changePercent: 0,
                priceInBTC: undefined,
                priceInUSD: undefined,
                lastUpdated: undefined,
                type: 'cryptocurrency'
            });
            let asset = null;
            if (!price.price) {
                try {
                    const priceResponse = await marketDataService.getAssetPriceInBTC(assetSymbol);
                    if (priceResponse) {
                        Object.assign(price, priceResponse);
                        if (mongoDbCache) {
                            await mongoDbCache.cacheAssetPrice(assetSymbol, price);
                        }
                    }
                }
                catch (err) {
                    console.error(`[useMarketData] Error fetching price for ${assetSymbol}:`, err);
                }
            }
            try {
                const response = await marketDataService.listAvailableAssets({ keywords: assetSymbol });
                asset = response.length > 0 ? response[0] : null;
            }
            catch (err) {
                console.error(`[useMarketData] Error fetching details for ${assetSymbol}:`, err);
            }
            setMarketData(prev => ({
                ...prev,
                asset: asset ? createDefaultAsset(asset.symbol) : null,
                price: price?.price || null,
                loading: false,
                error: !asset && !price ? `Failed to fetch data for ${assetSymbol}` : null
            }));
            if (asset || price) {
                await fetchHistoricalData(assetSymbol);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : `Failed to fetch data for ${assetSymbol}`;
            console.error(`[useMarketData] Error fetching asset by symbol ${assetSymbol}:`, err);
            setMarketData(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));
        }
    }, [fetchHistoricalData]);
    // Fetch market data with caching
    const fetchMarketData = useCallback(async () => {
        try {
            setMarketData(prev => ({ ...prev, loading: true, error: null }));
            const cachedPopularAssets = await safeExecuteMongo(async () => mongoDbCache?.getCachedAssetList('popular', 1, memoizedOptions.limit), null);
            const popularAssets = extractData(cachedPopularAssets, []);
            if (popularAssets.length === 0) {
                try {
                    const response = await marketDataService.listAvailableAssets({
                        category: 'cryptocurrency',
                        pageSize: memoizedOptions.limit
                    });
                    popularAssets.push(...(response || []));
                    if (mongoDbCache && response) {
                        await mongoDbCache.cacheAssetList('popular', 1, memoizedOptions.limit, {
                            data: popularAssets,
                            pagination: { totalItems: response.length }
                        });
                    }
                }
                catch (err) {
                    console.error('[useMarketData] Popular assets fetch error:', err);
                }
            }
            let typeAssets = [];
            if (memoizedOptions.type) {
                const cachedTypeAssets = await safeExecuteMongo(async () => mongoDbCache?.getCachedAssetList(memoizedOptions.type, 1, memoizedOptions.limit), null);
                typeAssets = extractData(cachedTypeAssets, []);
                if (typeAssets.length === 0) {
                    try {
                        const response = await marketDataService.listAvailableAssets({
                            category: memoizedOptions.type,
                            pageSize: memoizedOptions.limit
                        });
                        typeAssets.push(...(response || []));
                        if (mongoDbCache && response) {
                            await mongoDbCache.cacheAssetList(memoizedOptions.type, 1, memoizedOptions.limit, {
                                data: typeAssets,
                                pagination: { totalItems: response.length }
                            });
                        }
                    }
                    catch (err) {
                        console.error('[useMarketData] Assets by type fetch error:', err);
                    }
                }
            }
            const assets = (typeAssets.length > 0) ? typeAssets : popularAssets;
            const defaultSymbol = assets.length > 0 ? assets[0].symbol : null;
            if (defaultSymbol) {
                const cachedPrice = await safeExecuteMongo(async () => mongoDbCache?.getCachedAssetPrice(defaultSymbol), null);
                const price = extractData(cachedPrice, {
                    symbol: defaultSymbol,
                    price: 0,
                    change: 0,
                    changePercent: 0,
                    priceInBTC: undefined,
                    priceInUSD: undefined,
                    lastUpdated: undefined,
                    type: 'cryptocurrency'
                });
                let asset = null;
                if (!price.price) {
                    try {
                        const response = await marketDataService.getAssetPriceInBTC(defaultSymbol);
                        if (response) {
                            Object.assign(price, response);
                            if (mongoDbCache) {
                                await mongoDbCache.cacheAssetPrice(defaultSymbol, price);
                            }
                        }
                    }
                    catch (err) {
                        console.error('[useMarketData] Default price fetch error:', err);
                    }
                }
                try {
                    const response = await marketDataService.listAvailableAssets({ keywords: defaultSymbol });
                    asset = response.length > 0 ? response[0] : null;
                }
                catch (err) {
                    console.error('[useMarketData] Default asset fetch error:', err);
                }
                setMarketData(prev => ({
                    ...prev,
                    asset: asset ? createDefaultAsset(asset.symbol) : null,
                    price: price?.price || null,
                    popularAssets: assets || [],
                    assets: assets || [],
                    loading: false,
                    error: !asset && !price ? 'Failed to fetch asset data' : null
                }));
                if (asset || price) {
                    await fetchHistoricalData(defaultSymbol);
                }
            }
            else {
                setMarketData(prev => ({
                    ...prev,
                    popularAssets: assets || [],
                    assets: assets || [],
                    loading: false,
                    error: null
                }));
            }
        }
        catch (err) {
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
        let intervalId = null;
        if (autoRefresh && refreshInterval > 0) {
            intervalId = setInterval(() => {
                if (memoizedOptions.searchQuery) {
                    searchAssets(memoizedOptions.searchQuery);
                }
                else if (memoizedOptions.symbol) {
                    fetchAssetBySymbol(memoizedOptions.symbol);
                }
                else {
                    fetchMarketData();
                }
            }, refreshInterval);
        }
        return () => {
            if (intervalId)
                clearInterval(intervalId);
        };
    }, [fetchMarketData, fetchAssetBySymbol, searchAssets, memoizedOptions, autoRefresh, refreshInterval]);
    // Update the refetch method in the state
    useEffect(() => {
        setMarketData(prev => ({
            ...prev,
            refetch: () => fetchMarketData()
        }));
    }, [fetchMarketData]);
    return marketData;
}
