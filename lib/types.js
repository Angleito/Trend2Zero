// Asset Categories with Utility Functions
const AssetCategoryValues = {
    Metal: 'metal',
    Stock: 'stocks',
    Crypto: 'crypto'
};

const AssetCategories = {
    METAL: 'metal',
    STOCK: 'stocks',
    CRYPTO: 'crypto'
};

const AssetCategoryLabels = {
    metal: 'Metal',
    stocks: 'Stock',
    crypto: 'Crypto'
};

function isValidAssetCategory(category) {
    return Object.values(AssetCategoryValues).includes(category);
}

function parseAssetCategory(category) {
    const normalized = category.toLowerCase();
    if (normalized === 'crypto' || normalized === 'cryptocurrency') return AssetCategoryValues.Crypto;
    if (normalized === 'stocks' || normalized === 'stock') return AssetCategoryValues.Stock;
    if (normalized === 'metals' || normalized === 'metal') return AssetCategoryValues.Metal;
    return null;
}

function createDefaultAsset(symbol) {
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

function normalizeHistoricalDataPoint(data) {
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

module.exports = {
    AssetCategoryValues,
    AssetCategories,
    AssetCategoryLabels,
    isValidAssetCategory,
    parseAssetCategory,
    createDefaultAsset,
    normalizeHistoricalDataPoint
};
