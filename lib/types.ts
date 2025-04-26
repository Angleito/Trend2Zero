// Common Types for Market Data and Error Handling
import React from 'react';

// Expanded Error Handling
export interface ErrorResponse {
  error: string;
  status: number;
  details?: Record<string, any>;
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
// Aligning AssetCategoryValues with the AssetCategory union type
export const AssetCategoryValues = {
  Cryptocurrency: 'Cryptocurrency',
  Stocks: 'Stocks',
  PreciousMetal: 'Precious Metal',
  Commodities: 'Commodities', // Added Commodities
  Indices: 'Indices', // Added Indices
} as const;

export type AssetCategory = keyof typeof AssetCategoryValues; // Define AssetCategory based on keys

export function isValidAssetCategory(category: string): category is AssetCategory {
  // Check if the category string is one of the keys in AssetCategoryValues
  return Object.keys(AssetCategoryValues).includes(category);
}

export function parseAssetCategory(category: string): AssetCategory | undefined {
  const normalized = category.toLowerCase();
  if (normalized === 'cryptocurrency') return 'Cryptocurrency';
  if (normalized === 'stocks') return 'Stocks';
  if (normalized === 'precious metal' || normalized === 'precious_metal') return 'PreciousMetal'; // Use 'PreciousMetal' key
  if (normalized === 'commodities') return 'Commodities'; // Added Commodities parsing
  if (normalized === 'indices') return 'Indices'; // Added Indices parsing
  return undefined;
}

// Market Data Types with Extended Properties
export interface AssetPrice {
  symbol: string;
  name: string;
  type: string;
  price: number;
  change: number;
  changePercent: number;
  priceInBTC: number;
  priceInUSD: number;
  lastUpdated: string;
}

export interface AssetData extends AssetPrice {
  category?: AssetCategory;
}

export interface MarketAsset extends AssetPrice {
  // Extended fields can be added here
}

export interface HistoricalDataPoint {
  timestamp: number;
  date: Date;
  price: number;
  value: number;
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

export interface MarketOverview {
  marketStatus: 'open' | 'closed';
  lastUpdated: string;
  marketSummary: string;
  indices: Array<{
    Name: string;
    Value: number;
    Change: number;
  }>;
  topMovers: Array<{
    Symbol: string;
    Name: string;
    Price: number;
    Change: number;
    ChangePercent: number;
  }>;
}

// Utility Functions
export function createDefaultAsset(symbol: string): MarketAsset {
  return {
    symbol,
    name: symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    // Assign a default category, e.g., 'Cryptocurrency' or handle based on symbol
    // For now, assigning 'Cryptocurrency' as a placeholder
    type: 'Cryptocurrency', // Assuming default is Cryptocurrency
    priceInBTC: 0,
    priceInUSD: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export function normalizeHistoricalDataPoint(data: Partial<HistoricalDataPoint>): HistoricalDataPoint {
  return {
    timestamp: data.timestamp || 0,
    date: data.date || new Date(data.timestamp || 0),
    price: data.price || 0,
    value: data.value || data.price || 0,
    open: data.open || data.price || 0,
    high: data.high || data.price || 0,
    low: data.low || data.price || 0,
    close: data.close || data.price || 0,
    volume: data.volume || 0
  };
}
