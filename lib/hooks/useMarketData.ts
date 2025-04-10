import { useState, useEffect, useCallback } from 'react';
import * as marketDataService from '../api/marketDataService';
import { MarketData, MarketDataOptions, createDefaultAsset } from '../types';

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
    refetch: () => {}
  });

  const fetchMarketData = useCallback(async () => {
    try {
      setMarketData(prev => ({ ...prev, loading: true, error: null }));

      const fetchPromises: Promise<any>[] = [];

      // Fetch asset data if symbol is provided
      if (symbol) {
        fetchPromises.push(
          marketDataService.getAssetBySymbol(symbol)
            .then((response: any) => response?.data?.asset || null)
            .catch(err => {
              console.error('Asset fetch error:', err);
              return null;
            })
        );

        // Fetch price data
        fetchPromises.push(
          marketDataService.getAssetPrice(symbol)
            .then((response: any) => response?.data || null)
            .catch(err => {
              console.error('Price fetch error:', err);
              return null;
            })
        );

        // Fetch historical data
        fetchPromises.push(
          marketDataService.getHistoricalData(symbol)
            .then((response: any) => response?.data || null)
            .catch(err => {
              console.error('Historical data fetch error:', err);
              return null;
            })
        );
      }

      // Fetch popular assets
      fetchPromises.push(
        marketDataService.getPopularAssets(limit)
          .then((response: any) => response?.data?.assets || [])
          .catch(err => {
            console.error('Popular assets fetch error:', err);
            return [];
          })
      );

      // Fetch assets by type if type is provided
      if (type) {
        fetchPromises.push(
          marketDataService.getAssetsByType(type, limit)
            .then((response: any) => response?.data?.assets || [])
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
            .then((response: any) => response?.data?.assets || [])
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

      setMarketData(prev => ({
        ...prev,
        asset: asset ? createDefaultAsset(asset) : null,
        price: price || null,
        historicalData: historicalData || null,
        popularAssets: popularAssets || [],
        searchResults: searchResults || [],
        loading: false,
        error: null
      }));
    } catch (err: any) {
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

    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(fetchMarketData, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchMarketData, autoRefresh, refreshInterval]);

  // Update the refetch method in the state
  useEffect(() => {
    setMarketData(prev => ({
      ...prev,
      refetch: fetchMarketData
    }));
  }, [fetchMarketData]);

  return marketData;
}