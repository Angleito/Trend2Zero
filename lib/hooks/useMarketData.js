/**
 * Market Data Hooks
 *
 * This module provides React hooks for fetching market data.
 */

import { useState, useEffect, useCallback } from 'react';
import * as marketDataService from '../api/marketDataService';

/**
 * Comprehensive market data hook
 * @param {Object} options - Configuration options for market data fetching
 * @returns {Object} - Market data and related functions
 */
export const useMarketData = (options = {}) => {
  const {
    symbol = null,
    type = null,
    searchQuery = null,
    autoRefresh = false,
    refreshInterval = 60000,
    limit = 10
  } = options;

  const [marketData, setMarketData] = useState({
    asset: null,
    price: null,
    historicalData: null,
    popularAssets: [],
    searchResults: [],
    loading: true,
    error: null
  });

  const fetchMarketData = useCallback(async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));

      const fetchPromises = [];

      // Fetch asset data if symbol is provided
      if (symbol) {
        fetchPromises.push(
          marketDataService.getAssetBySymbol(symbol)
            .then(response => response.data.asset)
            .catch(err => {
              console.error('Asset fetch error:', err);
              return null;
            })
        );

        // Fetch price data
        fetchPromises.push(
          marketDataService.getAssetPrice(symbol)
            .then(response => response.data)
            .catch(err => {
              console.error('Price fetch error:', err);
              return null;
            })
        );

        // Fetch historical data
        fetchPromises.push(
          marketDataService.getHistoricalData(symbol)
            .then(response => response.data)
            .catch(err => {
              console.error('Historical data fetch error:', err);
              return null;
            })
        );
      }

      // Fetch popular assets
      fetchPromises.push(
        marketDataService.getPopularAssets(limit)
          .then(response => response.data.assets)
          .catch(err => {
            console.error('Popular assets fetch error:', err);
            return [];
          })
      );

      // Fetch assets by type if type is provided
      if (type) {
        fetchPromises.push(
          marketDataService.getAssetsByType(type, limit)
            .then(response => response.data.assets)
            .catch(err => {
              console.error('Assets by type fetch error:', err);
              return [];
            })
        );
      }

      // Perform search if query is provided
      if (searchQuery) {
        fetchPromises.push(
          marketDataService.searchAssets(searchQuery)
            .then(response => response.data.assets)
            .catch(err => {
              console.error('Search assets error:', err);
              return [];
            })
        );
      }

      const [
        asset,
        price,
        historicalData,
        popularAssets,
        typeAssets,
        searchResults
      ] = await Promise.all(fetchPromises);

      setMarketData({
        asset: asset || null,
        price: price || null,
        historicalData: historicalData || null,
        popularAssets: popularAssets || [],
        searchResults: searchResults || [],
        loading: false,
        error: null
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch market data';
      setMarketData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [symbol, type, searchQuery, limit]);

  useEffect(() => {
    fetchMarketData();

    let intervalId;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(fetchMarketData, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchMarketData, autoRefresh, refreshInterval]);

  return {
    ...marketData,
    refetch: fetchMarketData
  };
};

// Re-export individual hooks for backward compatibility
export * from './useMarketData';
