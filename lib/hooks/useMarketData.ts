'use client';

import { useState, useEffect } from 'react';
import { MarketData, MarketDataOptions, MarketAsset } from '../types';

const defaultOptions: MarketDataOptions = {
  limit: 10,
  autoRefresh: false,
  refreshInterval: 60000, // 1 minute
};

export function useMarketData(options: Partial<MarketDataOptions> = {}): MarketData {
  const [state, setState] = useState<MarketData>({
    assets: [],
    loading: true,
    error: null,
  });

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const params = new URLSearchParams();
        if (mergedOptions.limit) {
          params.set('limit', mergedOptions.limit.toString());
        }
        if (mergedOptions.category) {
          params.set('category', mergedOptions.category);
        }

        const response = await fetch(`/api/market-data/popular?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }
        const data = await response.json();
        setState({ assets: data, loading: false, error: null });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch market data'
        }));
      }
    };

    fetchData();

    if (mergedOptions.autoRefresh) {
      const interval = setInterval(fetchData, mergedOptions.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [mergedOptions.limit, mergedOptions.category, mergedOptions.autoRefresh, mergedOptions.refreshInterval]);

  return state;
}

export function useAssetPrice(symbol: string, autoRefresh = false, refreshInterval = 60000) {
  const [state, setState] = useState<{
    priceData: any;
    loading: boolean;
    error: string | null;
  }>({
    priceData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch(`/api/market-data/price/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }
        const data = await response.json();
        setState({
          priceData: data,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch price data'
        }));
      }
    };

    fetchPrice();

    if (autoRefresh) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  return {
    ...state,
    refetch: () => setState(prev => ({ ...prev, loading: true })),
  };
}

export function useHistoricalData(symbol: string, days = 30) {
  const [state, setState] = useState<{
    historicalData: any;
    loading: boolean;
    error: string | null;
  }>({
    historicalData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch(`/api/market-data/historical/${symbol}?days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        setState({
          historicalData: data,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch historical data'
        }));
      }
    };

    fetchHistoricalData();
  }, [symbol, days]);

  return {
    ...state,
    refetch: () => setState(prev => ({ ...prev, loading: true })),
  };
}