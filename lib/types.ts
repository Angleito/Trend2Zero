// Asset Categories
export type AssetCategory = 'Stocks' | 'Commodities' | 'Indices' | 'Cryptocurrency';

// Market Asset Type
export interface MarketAsset {
  id?: string;
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  type?: AssetCategory;
}

// Asset Data Type
export interface AssetData {
  id?: string;
  symbol: string;
  name?: string;
  description?: string;
  type?: AssetCategory;
  currentPrice?: number;
  price: number;
  change: number;
  changePercent: number;
  priceInBTC: number;
  priceInUSD: number;
  historicalData?: HistoricalDataPoint[];
}

// Historical Data Point
export interface HistoricalDataPoint {
  date: string;
  price: number;
  volume?: number;
}

// Market Data Hook Type
export interface MarketData {
  asset: AssetData | null;
  price: number | null;
  historicalData: HistoricalDataPoint[] | null;
  popularAssets: MarketAsset[];
  searchResults: MarketAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Market Data Hook Options
export interface MarketDataOptions {
  symbol?: string | null;
  type?: AssetCategory | null;
  searchQuery?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
}

// Utility function to create a default asset
export function createDefaultAsset(partialAsset: Partial<AssetData> = {}): AssetData {
  return {
    symbol: partialAsset.symbol || '',
    price: partialAsset.price || 0,
    change: partialAsset.change || 0,
    changePercent: partialAsset.changePercent || 0,
    priceInBTC: partialAsset.priceInBTC || 0,
    priceInUSD: partialAsset.priceInUSD || 0,
    id: partialAsset.id,
    name: partialAsset.name,
    description: partialAsset.description,
    type: partialAsset.type,
    currentPrice: partialAsset.currentPrice,
    historicalData: partialAsset.historicalData || []
  };
}