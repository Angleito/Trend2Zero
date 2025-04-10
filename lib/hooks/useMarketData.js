/**
 * Market Data Hooks
 *
 * This module provides React hooks for fetching market data.
 */

import { useState, useEffect, useCallback } from 'react';
import * as marketDataService from '../api/marketDataService';

/**
 * Hook for fetching asset data by symbol
 * @param {string} symbol - Asset symbol
 * @param {Function} [fetchFn] - Optional custom fetch function for dependency injection
 * @returns {Object} - Asset data and loading state
 */
export const useAsset = (symbol, fetchFn = null) => {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultFetchFn = async (sym) => {
    const response = await marketDataService.getAssetBySymbol(sym);
    return response.data.asset;
  };

  const fetchAsset = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const fetchFunction = fetchFn || defaultFetchFn;
      const fetchedAsset = await fetchFunction(symbol);
      setAsset(fetchedAsset);
      setError(null);
      return fetchedAsset;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch asset data';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [symbol, fetchFn]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  return { asset, loading, error, refetch: fetchAsset };
};

/**
 * Hook for fetching asset price data by symbol
 * @param {string} symbol - Asset symbol
 * @param {boolean} autoRefresh - Whether to automatically refresh the data
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} - Price data and loading state
 */
export const useAssetPrice = (symbol, autoRefresh = false, refreshInterval = 60000, fetchFn = null) => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultFetchFn = async (sym) => {
    const response = await marketDataService.getAssetPrice(sym);
    return response.data;
  };

  const fetchPrice = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const fetchFunction = fetchFn || defaultFetchFn;
      const fetchedPriceData = await fetchFunction(symbol);
      setPriceData(fetchedPriceData);
      setError(null);
      return fetchedPriceData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch price data';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [symbol, fetchFn]);

  useEffect(() => {
    fetchPrice();

    // Set up auto-refresh if enabled
    let intervalId;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(fetchPrice, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchPrice, autoRefresh, refreshInterval]);

  return { priceData, loading, error, refetch: fetchPrice };
};

/**
 * Hook for fetching historical data for an asset
 * @param {string} symbol - Asset symbol
 * @param {Object} options - Query options
 * @param {string} options.timeframe - Time interval (daily, weekly, monthly)
 * @param {string} options.currency - Currency for prices (USD, BTC)
 * @param {number} options.days - Number of days of historical data
 * @returns {Object} - Historical data and loading state
 */
export const useHistoricalData = (symbol, options = {}, fetchFn = null) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultFetchFn = async (sym, opts) => {
    const response = await marketDataService.getHistoricalData(sym, opts);
    return response.data;
  };

  const fetchHistoricalData = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const fetchFunction = fetchFn || defaultFetchFn;
      const fetchedHistoricalData = await fetchFunction(symbol, options);
      setHistoricalData(fetchedHistoricalData);
      setError(null);
      return fetchedHistoricalData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch historical data';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [symbol, options, fetchFn]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return { historicalData, loading, error, refetch: fetchHistoricalData };
};

/**
 * Hook for searching assets
 * @returns {Object} - Search function and state
 */
export const useAssetSearch = (searchFn = null) => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultSearchFn = async (query, type = 'all', limit = 10) => {
    const response = await marketDataService.searchAssets(query, type, limit);
    return response.data.assets;
  };

  const search = useCallback(async (query, type = 'all', limit = 10) => {
    if (!query) {
      setSearchResults([]);
      return [];
    }

    try {
      setLoading(true);
      const searchFunction = searchFn || defaultSearchFn;
      const fetchedSearchResults = await searchFunction(query, type, limit);
      setSearchResults(fetchedSearchResults);
      setError(null);
      return fetchedSearchResults;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to search assets';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  return { search, searchResults, loading, error };
};

/**
 * Hook for fetching popular assets
 * @param {number} limit - Maximum number of results
 * @returns {Object} - Popular assets and loading state
 */
export const usePopularAssets = (limit = 10, fetchFn = null) => {
  const [popularAssets, setPopularAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultFetchFn = async (lim) => {
    const response = await marketDataService.getPopularAssets(lim);
    return response.data.assets;
  };

  const fetchPopularAssets = useCallback(async () => {
    try {
      setLoading(true);
      const fetchFunction = fetchFn || defaultFetchFn;
      const fetchedPopularAssets = await fetchFunction(limit);
      setPopularAssets(fetchedPopularAssets);
      setError(null);
      return fetchedPopularAssets;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch popular assets';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limit, fetchFn]);

  useEffect(() => {
    fetchPopularAssets();
  }, [fetchPopularAssets]);

  return { popularAssets, loading, error, refetch: fetchPopularAssets };
};

/**
 * Hook for fetching assets by type
 * @param {string} type - Asset type
 * @param {number} limit - Maximum number of results
 * @returns {Object} - Assets and loading state
 */
export const useAssetsByType = (type, limit = 20, fetchFn = null) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultFetchFn = async (assetType, lim) => {
    const response = await marketDataService.getAssetsByType(assetType, lim);
    return response.data.assets;
  };

  const fetchAssetsByType = useCallback(async () => {
    if (!type) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      const fetchFunction = fetchFn || defaultFetchFn;
      const fetchedAssets = await fetchFunction(type, limit);
      setAssets(fetchedAssets);
      setError(null);
      return fetchedAssets;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch assets by type';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [type, limit, fetchFn]);

  useEffect(() => {
    fetchAssetsByType();
  }, [fetchAssetsByType]);

  return { assets, loading, error, refetch: fetchAssetsByType };
};
