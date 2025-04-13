const marketDataServiceModule = require('../../services/marketDataService');
const AppError = require('../../utils/appError');
const cache = require('../../utils/cache');
const axios = require('axios');

// Mock these modules
jest.mock('../../utils/cache');
jest.mock('axios');
jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
}));

describe('Market Data Service', () => {
    let marketDataService;
    let mockAxiosGet;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a mock for axios.get that we can control
        mockAxiosGet = jest.fn();
        mockAxiosGet.mockImplementation((url, options) => {
            if (url.includes('/v1/market-data/')) {
                return Promise.resolve({ data: { symbol: url.split('/').pop(), price: 1000 } });
            } else if (url.includes('/v1/history/')) {
                return Promise.resolve({ data: [{ date: '2023-01-01', price: 1000 }] });
            } else if (url === '/v1/search') {
                return Promise.resolve({ data: [{ symbol: 'BTC', name: 'Bitcoin' }] });
            } else if (url === '/v1/market/overview') {
                return Promise.resolve({ data: { totalMarketCap: 2000000000000 } });
            }
            return Promise.resolve({ data: {} });
        });

        // Replace the apiClient in marketDataService with our mock
        marketDataService = marketDataServiceModule;
        marketDataService.apiClient = {
            get: mockAxiosGet
        };
    });

    describe('getAssetPrice', () => {
        it('should fetch price data correctly', async () => {
            const result = await marketDataService.getMarketData('BTC');
            expect(result).toEqual({ symbol: 'BTC', price: 1000 });
            expect(mockAxiosGet).toHaveBeenCalledWith('/v1/market-data/BTC');
        });

        it('should handle API errors gracefully', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

            await expect(marketDataService.getMarketData('BTC'))
                .rejects.toThrow('Failed to fetch market data');
        });
    });

    describe('getHistoricalData', () => {
        it('should fetch historical data correctly', async () => {
            const result = await marketDataService.getAssetHistory('BTC');
            expect(result).toEqual([{ date: '2023-01-01', price: 1000 }]);
            expect(mockAxiosGet).toHaveBeenCalledWith('/v1/history/BTC', { params: { days: 30, interval: '1d' } });
        });

        it('should handle API errors gracefully', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

            await expect(marketDataService.getAssetHistory('BTC'))
                .rejects.toThrow('Failed to fetch asset history');
        });
    });

    describe('searchAssets', () => {
        it('should search assets correctly', async () => {
            const result = await marketDataService.searchAssets('test');
            expect(result).toEqual([{ symbol: 'BTC', name: 'Bitcoin' }]);
            expect(mockAxiosGet).toHaveBeenCalledWith('/v1/search', { params: { query: 'test', type: 'crypto', limit: 5 } });
        });

        it('should handle API errors gracefully', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

            await expect(marketDataService.searchAssets('test'))
                .rejects.toThrow('Failed to search assets');
        });
    });

    describe('getMarketOverview', () => {
        it('should fetch market overview correctly', async () => {
            const result = await marketDataService.getMarketOverview();
            expect(result).toEqual({ totalMarketCap: 2000000000000 });
            expect(mockAxiosGet).toHaveBeenCalledWith('/v1/market/overview');
        });

        it('should handle API errors gracefully', async () => {
            mockAxiosGet.mockRejectedValueOnce(new Error('API Error'));

            await expect(marketDataService.getMarketOverview())
                .rejects.toThrow('Failed to fetch market overview');
        });
    });
});
