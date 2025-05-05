// Asset Categories with Utility Functions
export const AssetCategoryValues = {
    Metal: 'metal',
    Stock: 'stocks',
    Crypto: 'crypto'
} as const;

export type AssetCategory = typeof AssetCategoryValues[keyof typeof AssetCategoryValues];

export const AssetCategories = {
    METAL: 'metal',
    STOCK: 'stocks',
    CRYPTO: 'crypto'
} as const;

export const AssetCategoryLabels = {
    metal: 'Metal',
    stocks: 'Stock',
    crypto: 'Crypto'
} as const;

export interface MarketDataOptions {
    category?: AssetCategory;
    limit?: number;
    page?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface AssetPrice {
    symbol: string;
    name?: string;
    price: number;
    priceInUSD?: number;
    priceInBTC?: number;
    change: number;
    changePercent: number;
    lastUpdated?: string;
    type?: string;
}

export interface ErrorResponse {
    error: string;
    status?: number;
}

export interface HistoricalDataPoint {
    timestamp: number;
    date: Date;
    price: number;
    value: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export function isValidAssetCategory(category: string): category is AssetCategory {
    return Object.values(AssetCategoryValues).includes(category as AssetCategory);
}

export function parseAssetCategory(category: string | null): AssetCategory | null {
    if (!category) return null;
    const normalized = category.toLowerCase();
    if (normalized === 'crypto' || normalized === 'cryptocurrency') return AssetCategoryValues.Crypto;
    if (normalized === 'stocks' || normalized === 'stock') return AssetCategoryValues.Stock;
    if (normalized === 'metals' || normalized === 'metal') return AssetCategoryValues.Metal;
    return null;
}

export function createDefaultAsset(symbol: string) {
    return {
        symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        category: null,
        lastUpdated: new Date().toISOString()
    };
}

export function normalizeHistoricalDataPoint(data: any): HistoricalDataPoint {
    return {
        timestamp: data.timestamp || data.time || (Array.isArray(data) ? data[0] : 0),
        date: data.date || new Date(data.timestamp || (Array.isArray(data) ? data[0] : 0)),
        price: data.price || (Array.isArray(data) ? data[1] : 0),
        value: data.value || data.price || (Array.isArray(data) ? data[1] : 0),
        open: data.open || data.price || (Array.isArray(data) ? data[1] : 0),
        high: data.high || data.price || (Array.isArray(data) ? data[1] : 0),
        low: data.low || data.price || (Array.isArray(data) ? data[1] : 0),
        close: data.close || data.price || (Array.isArray(data) ? data[1] : 0),
        volume: data.volume || 0
    };
}
