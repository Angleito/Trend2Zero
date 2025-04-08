// Asset types
export type AssetCategory = 'Cryptocurrency' | 'Stocks' | 'Commodities' | 'Indices' | 'Unknown';

export interface MarketAsset {
  symbol: string;
  name: string;
  type: AssetCategory;
  description?: string;
  image?: string;
}

export interface AssetData {
  name: string;
  symbol: string;
  type: AssetCategory;
  priceInBTC: number;
  priceInUSD: number;
  returns: {
    ytd: number;
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    max: number;
  };
  lastUpdated: Date;
  image?: string;
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}