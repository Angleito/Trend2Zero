import { MarketAsset, AssetPrice, HistoricalDataPoint, MarketOverview, AssetCategory } from '../types';

export class MarketDataService {
    constructor();
    listAvailableAssets(options?: { page?: number; pageSize?: number; category?: string; keywords?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; searchQuery?: string }): Promise<MarketAsset[]>;
    getAssetPrice(symbol: string): Promise<AssetPrice | null>;
    getHistoricalData(symbol: string, days?: number): Promise<HistoricalDataPoint[]>;
    getMarketOverview(): Promise<MarketOverview | null>;
    isCryptoCurrency(symbol: string): boolean;
    getMockAssets(category?: string, limit?: number): MarketAsset[];
}

declare const marketDataService: MarketDataService;

export default marketDataService;

// Also declare the named exports for completeness, although the API routes use the default instance
export function getPopularAssets(options?: { limit?: number; category?: AssetCategory }): Promise<MarketAsset[]>;
export function searchAssets(query: string, limit?: number): Promise<MarketAsset[]>;
export function getAssetPrice(symbol: string): Promise<AssetPrice | null>;
export function getHistoricalData(symbol: string, days?: number): Promise<HistoricalDataPoint[]>;