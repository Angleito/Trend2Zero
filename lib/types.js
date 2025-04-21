// Asset Categories with Utility Functions
export const AssetCategoryValues = {
    Cryptocurrency: 'cryptocurrency',
    Stock: 'stocks',
    Commodity: 'metals',
    Currency: 'currency',
    Index: 'indices',
    Other: 'other'
};
export function isValidAssetCategory(category) {
    return Object.values(AssetCategoryValues).includes(category);
}
export function parseAssetCategory(category) {
    const normalized = category.toLowerCase();
    if (normalized === 'cryptocurrency')
        return 'Cryptocurrency';
    if (normalized === 'stocks')
        return 'Stocks';
    if (normalized === 'precious metal' || normalized === 'precious_metal')
        return 'Precious Metal';
    return undefined;
}
// Utility Functions
export function createDefaultAsset(symbol) {
    return {
        symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        category: AssetCategoryValues.Other
    };
}
export function normalizeHistoricalDataPoint(data) {
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
