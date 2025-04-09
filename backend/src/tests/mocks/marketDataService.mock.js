const marketDataServiceMock = {
    getPopularAssets: jest.fn(),
    getAssetPrice: jest.fn(),
    getHistoricalPrices: jest.fn(),
    searchAssets: jest.fn(),
    getMarketOverview: jest.fn(),
    getAssetDetails: jest.fn(),
    getAssetMetrics: jest.fn(),
    updateAssetData: jest.fn(),
    getLatestPrices: jest.fn(),
    getTrendingAssets: jest.fn()
};

// Default successful responses
marketDataServiceMock.getPopularAssets.mockResolvedValue([
    { symbol: 'BTC', name: 'Bitcoin', popularity: 100 },
    { symbol: 'ETH', name: 'Ethereum', popularity: 90 }
]);

marketDataServiceMock.getAssetPrice.mockResolvedValue({
    symbol: 'BTC',
    price: 50000,
    currency: 'USD',
    lastUpdated: new Date()
});

marketDataServiceMock.getHistoricalPrices.mockResolvedValue([
    { date: '2025-01-01', price: 50000 },
    { date: '2025-01-02', price: 51000 }
]);

marketDataServiceMock.searchAssets.mockResolvedValue([
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'BCH', name: 'Bitcoin Cash' }
]);

marketDataServiceMock.getMarketOverview.mockResolvedValue({
    totalMarketCap: 2000000000000,
    volume24h: 100000000000,
    btcDominance: 45
});

marketDataServiceMock.getAssetDetails.mockResolvedValue({
    symbol: 'BTC',
    name: 'Bitcoin',
    description: 'Digital gold',
    website: 'https://bitcoin.org'
});

marketDataServiceMock.getAssetMetrics.mockResolvedValue({
    symbol: 'BTC',
    marketCap: 1000000000000,
    volume24h: 50000000000,
    circulatingSupply: 19000000
});

marketDataServiceMock.updateAssetData.mockResolvedValue({
    success: true,
    updatedAt: new Date()
});

marketDataServiceMock.getLatestPrices.mockResolvedValue([
    { symbol: 'BTC', price: 50000 },
    { symbol: 'ETH', price: 3000 }
]);

marketDataServiceMock.getTrendingAssets.mockResolvedValue([
    { symbol: 'BTC', trend: 'up' },
    { symbol: 'ETH', trend: 'up' }
]);

// Error responses for testing error scenarios
const mockError = new Error('API Error');
marketDataServiceMock.getPopularAssets.mockRejectedValueOnce(mockError);
marketDataServiceMock.getAssetPrice.mockRejectedValueOnce(mockError);
marketDataServiceMock.getHistoricalPrices.mockRejectedValueOnce(mockError);

module.exports = marketDataServiceMock;