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
 * @returns {Object} - Asset data and loading state
 */
export const useAsset = (symbol) => {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!symbol) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await marketDataService.getAssetBySymbol(symbol);
        setAsset(response.data.asset);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch asset data');
        console.error(`Error fetching asset ${symbol}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [symbol]);

  return { asset, loading, error };
};

/**
 * Hook for fetching asset price data by symbol
 * @param {string} symbol - Asset symbol
 * @param {boolean} autoRefresh - Whether to automatically refresh the data
 * @param {number} refreshInterval - Refresh interval in milliseconds
 * @returns {Object} - Price data and loading state
 */
export const useAssetPrice = (symbol, autoRefresh = false, refreshInterval = 60000) => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrice = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await marketDataService.getAssetPrice(symbol);
      setPriceData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch price data');
      console.error(`Error fetching price for ${symbol}:`, err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

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
export const useHistoricalData = (symbol, options = {}) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistoricalData = useCallback(async () => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await marketDataService.getHistoricalData(symbol, options);
      setHistoricalData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch historical data');
      console.error(`Error fetching historical data for ${symbol}:`, err);
    } finally {
      setLoading(false);
    }
  }, [symbol, options]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return { historicalData, loading, error, refetch: fetchHistoricalData };
};

/**
 * Hook for searching assets
 * @returns {Object} - Search function and state
 */
export const useAssetSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, type = 'all', limit = 10) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await marketDataService.searchAssets(query, type, limit);
      setSearchResults(response.data.assets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search assets');
      console.error(`Error searching assets for "${query}":`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, searchResults, loading, error };
};

/**
 * Hook for fetching popular assets
 * @param {number} limit - Maximum number of results
 * @returns {Object} - Popular assets and loading state
 */
export const usePopularAssets = (limit = 10) => {
  const [popularAssets, setPopularAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPopularAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await marketDataService.getPopularAssets(limit);
      setPopularAssets(response.data.assets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch popular assets');
      console.error('Error fetching popular assets:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

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
export const useAssetsByType = (type, limit = 20) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssetsByType = useCallback(async () => {
    if (!type) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await marketDataService.getAssetsByType(type, limit);
      setAssets(response.data.assets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assets by type');
      console.error(`Error fetching assets of type ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchAssetsByType();
  }, [fetchAssetsByType]);

  return { assets, loading, error, refetch: fetchAssetsByType };
};
