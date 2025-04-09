const marketDataService = {
    searchAssets: jest.fn(),
    getPopularAssets: jest.fn(),
    getAssetPrice: jest.fn(),
    getHistoricalPrices: jest.fn()
};

const coinMarketCapService = {
    getCryptoPrice: jest.fn(),
    getHistoricalData: jest.fn(),
    searchCrypto: jest.fn(),
    getMarketOverview: jest.fn()
};

const alphaVantageService = {
    getStockPrice: jest.fn(),
    getStockHistory: jest.fn(),
    searchStocks: jest.fn(),
    getMarketNews: jest.fn()
};

// Reset all mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});

module.exports = {
    mockMarketDataService: marketDataService,
    mockCoinMarketCapService: coinMarketCapService,
    mockAlphaVantageService: alphaVantageService
};