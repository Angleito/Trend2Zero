import React from 'react';

// Asset and Market Data Types
export type AssetCategory = 'cryptocurrency' | 'stocks' | 'metals' | 'indices';

export interface OHLCDataPoint {
  timestamp?: number;
  date?: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoricalDataPoint {
  timestamp?: number;
  date?: Date;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface AssetPrice {
  id: string;
  symbol: string;
  name: string;
  type: AssetCategory;
  price: number;
  change: number;
  changePercent: number;
  priceInBTC: number;
  priceInUSD: number;
  lastUpdated: string;
}

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetCategory;
  description?: string;
  logo?: string;
}

export interface AssetData extends MarketAsset {
  currentPrice?: number;
  historicalData?: HistoricalDataPoint[];
  price?: number;
  change?: number;
  changePercent?: number;
  priceInBTC?: number;
  priceInUSD?: number;
  lastUpdated?: string;
}

export interface MarketDataOptions {
  symbol?: string | null;
  type?: string | null;
  searchQuery?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

export interface MarketData {
  asset: AssetData | null;
  price: number | null;
  historicalData: HistoricalDataPoint[] | null;
  popularAssets: MarketAsset[];
  searchResults: MarketAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  assets: MarketAsset[]; // Added to match the usage in page.tsx
}

// Error Boundary Types
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Utility function to create a default asset
export function createDefaultAsset(asset: Partial<AssetData>): AssetData {
  return {
    id: asset.id || '',
    symbol: asset.symbol || '',
    name: asset.name || '',
    type: asset.type || 'cryptocurrency',
    description: asset.description || '',
    logo: asset.logo || '',
    currentPrice: asset.currentPrice,
    historicalData: asset.historicalData,
    price: asset.price,
    change: asset.change,
    changePercent: asset.changePercent,
    priceInBTC: asset.priceInBTC,
    priceInUSD: asset.priceInUSD,
    lastUpdated: asset.lastUpdated
  };
}

// Utility function to convert various data point formats
export function normalizeHistoricalDataPoint(point: any): HistoricalDataPoint {
  // Handle different input formats
  if (Array.isArray(point)) {
    // [timestamp, price] format
    return {
      timestamp: point[0],
      price: point[1]
    };
  }

  // Handle object with multiple possible properties
  return {
    timestamp: point.timestamp || (point.date ? point.date.getTime() : undefined),
    date: point.date instanceof Date ? point.date : (point.timestamp ? new Date(point.timestamp) : undefined),
    price: point.price || point.close || 0,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    volume: point.volume
  };
}
