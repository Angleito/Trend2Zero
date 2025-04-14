// Common Types for Market Data and Error Handling
import React from 'react';

// Expanded Error Handling
export interface ErrorResponse {
  error: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Asset Categories with Utility Functions
export const AssetCategoryValues = {
  Cryptocurrency: 'cryptocurrency',
  Stock: 'stocks',
  Commodity: 'metals',
  Currency: 'currency',
  Index: 'indices',
  Other: 'other'
} as const;

export type AssetCategory = typeof AssetCategoryValues[keyof typeof AssetCategoryValues];

export function isValidAssetCategory(category: string): category is AssetCategory {
  return Object.values(AssetCategoryValues).includes(category as AssetCategory);
}

export function parseAssetCategory(category: string): AssetCategory {
  return isValidAssetCategory(category) 
    ? category 
    : AssetCategoryValues.Other;
}

// Market Data Types with Extended Properties
export interface AssetPrice {
  symbol: string;
  name?: string;
  id?: string;
  price: number;
  change: number;
  changePercent: number;
  priceInBTC?: number;
  priceInUSD?: number;
  lastUpdated?: string;
  type?: string;
  volume24h?: number;
  marketCap?: number;
}

export interface AssetData extends AssetPrice {
  category?: AssetCategory;
}

export interface MarketAsset extends AssetData {
  rank?: number;
  type?: string;
}

export interface HistoricalDataPoint {
  timestamp: number | string;
  value: number;
  date?: Date;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface OHLCDataPoint extends HistoricalDataPoint {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketData {
  assets: MarketAsset[];
  popularAssets?: MarketAsset[];
  loading: boolean;
  error?: string | null;
  refetch?: () => void;
  price?: number | null;
  historicalData?: HistoricalDataPoint[] | null;
  searchResults?: MarketAsset[];
}

export interface MarketDataOptions {
  limit?: number;
  category?: AssetCategory;
  sortBy?: keyof MarketAsset;
  sortOrder?: 'asc' | 'desc';
  symbol?: string;
  type?: string;
  searchQuery?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Utility Functions
export function createDefaultAsset(symbol: string): MarketAsset {
  return {
    symbol,
    name: symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    category: AssetCategoryValues.Other
  };
}

export function normalizeHistoricalDataPoint(point: any): HistoricalDataPoint {
  return {
    timestamp: point.timestamp || point.date,
    value: point.value || point.close || 0,
    date: point.date instanceof Date ? point.date : new Date(point.date),
    price: point.price,
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    volume: point.volume
  };
}
