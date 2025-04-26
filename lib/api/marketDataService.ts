import { AssetData, HistoricalDataPoint, MarketAsset } from '../types';

export async function getAssetPrice(symbol: string, type?: string): Promise<AssetData> {
    const response = await fetch(`/api/assets/${symbol}/price?type=${type || 'crypto'}`);
    if (!response.ok) throw new Error('Failed to fetch asset price');
    return response.json();
}

export async function getHistoricalData(symbol: string, interval: string): Promise<HistoricalDataPoint[]> {
    const response = await fetch(`/api/assets/${symbol}/history?interval=${interval}`);
    if (!response.ok) throw new Error('Failed to fetch historical data');
    return response.json();
}

export async function searchAssets(query: string, type?: string): Promise<MarketAsset[]> {
    const response = await fetch(`/api/assets/search?q=${query}&type=${type || 'crypto'}`);
    if (!response.ok) throw new Error('Failed to search assets');
    return response.json();
}

export async function getMarketOverview(): Promise<any> {
    const response = await fetch('/api/market/overview');
    if (!response.ok) throw new Error('Failed to fetch market overview');
    return response.json();
}

export async function getTrendingAssets(): Promise<MarketAsset[]> {
    const response = await fetch('/api/market/trending');
    if (!response.ok) throw new Error('Failed to fetch trending assets');
    return response.json();
}

export async function getPopularAssets(options?: { limit?: number }): Promise<MarketAsset[]> {
    const limit = options?.limit || 10; // Default limit to 10 if not provided
    const response = await fetch(`/api/market/popular?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch popular assets');
    return response.json();
}