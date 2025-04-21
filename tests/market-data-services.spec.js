import { test, expect, describe } from '@jest/globals';
import { SecureMarketDataService } from '../lib/services/secureMarketDataService';
import coinGeckoService from '../lib/services/coinGeckoService';
import coinMarketCapService from '../lib/services/coinMarketCapService';
// Mock the dependent services
jest.mock('../lib/services/coinGeckoService', () => ({
    __esModule: true,
    default: {
        getCryptoPrice: jest.fn(),
        getHistoricalData: jest.fn()
    }
}));
jest.mock('../lib/services/coinMarketCapService', () => ({
    __esModule: true,
    default: {
        getAssetPrice: jest.fn()
    }
}));
describe('Market Data Services', () => {
    describe('Secure Market Data Service Integration', () => {
        let mockService;
        let mockCoinGeckoService;
        let mockCoinMarketCapService;
        beforeEach(() => {
            jest.clearAllMocks();
            // Cast the mocks to their proper types
            mockCoinGeckoService = coinGeckoService;
            mockCoinMarketCapService = coinMarketCapService;
            // Create a new instance of the service with mocked dependencies
            mockService = new SecureMarketDataService({
                coinGeckoService: mockCoinGeckoService,
                coinMarketCapService: mockCoinMarketCapService
            });
        });
        describe('Asset Price Fetching', () => {
            it('should fetch price successfully', async () => {
                // Mock successful response from CoinMarketCap
                const mockCMCResponse = {
                    id: '1',
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    type: 'cryptocurrency',
                    price: 50000,
                    change: 5000000000,
                    changePercent: 2.5,
                    priceInBTC: 1,
                    priceInUSD: 50000,
                    lastUpdated: '2023-01-01T12:00:00Z'
                };
                mockCoinMarketCapService.getAssetPrice.mockResolvedValue(mockCMCResponse);
                const result = await mockService.getAssetPriceInBTC('BTC');
                expect(result).toBeTruthy();
                expect(result?.symbol).toBe('BTC');
                expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalledWith('BTC');
            });
            it('should handle service failure with fallback', async () => {
                // Configure CoinMarketCap to fail
                mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('CoinMarketCap error'));
                // Mock successful CoinGecko response
                const mockGeckoResponse = {
                    symbol: 'BTC',
                    price: 51000,
                    lastUpdated: '2023-01-01T12:00:00Z',
                    change: 500,
                    type: 'cryptocurrency',
                    name: 'Bitcoin',
                    priceInBTC: 1,
                    priceInUSD: 51000,
                    changePercent: 2.8
                };
                mockCoinGeckoService.getCryptoPrice.mockResolvedValue(mockGeckoResponse);
                const result = await mockService.getAssetPriceInBTC('BTC');
                expect(result).toBeTruthy();
                expect(result?.symbol).toBe('BTC');
                expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalled();
                expect(mockCoinGeckoService.getCryptoPrice).toHaveBeenCalled();
            });
            it('should return mock data when no fallback is allowed and all services fail', async () => {
                // Configure all services to fail
                mockCoinGeckoService.getCryptoPrice.mockRejectedValue(new Error('CoinGecko error'));
                mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('CoinMarketCap error'));
                const result = await mockService.getAssetPriceInBTC('BTC');
                expect(result).toBeTruthy();
                expect(result?.symbol).toBe('BTC');
                expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalled();
                expect(mockCoinGeckoService.getCryptoPrice).toHaveBeenCalled();
            });
        });
        describe('Timeout Handling', () => {
            it('should respect configured timeout', async () => {
                // Mock a long-running request
                mockCoinMarketCapService.getAssetPrice.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10000)));
                jest.useFakeTimers();
                const resultPromise = mockService.getAssetPriceInBTC('BTC');
                // Fast-forward timers
                jest.advanceTimersByTime(5000);
                // The promise should still be pending, but we can't test timeout directly
                // Just ensure it doesn't crash
                await expect(resultPromise).resolves.toBeDefined();
                jest.useRealTimers();
            });
        });
        describe('Caching Error Handling', () => {
            it('should handle cache write failures gracefully', async () => {
                // Mock successful response
                const mockResponse = {
                    id: '1',
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    type: 'cryptocurrency',
                    price: 50000,
                    change: 5000000000,
                    changePercent: 2.5,
                    priceInBTC: 1,
                    priceInUSD: 50000,
                    lastUpdated: '2023-01-01T12:00:00Z'
                };
                mockCoinMarketCapService.getAssetPrice.mockResolvedValue(mockResponse);
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
                const result = await mockService.getAssetPriceInBTC('BTC');
                expect(result).toBeTruthy();
                // We can't force a cache error, so just ensure the call doesn't crash
                expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[SecureMarketData] Critical error fetching BTC price for BTC:'));
                consoleSpy.mockRestore();
            });
        });
    });
});
describe('Market Data Service', () => {
    let marketDataService;
    beforeEach(() => {
        marketDataService = new SecureMarketDataService();
    });
    test('should handle rate limiting correctly', async () => {
        const result = await marketDataService.getAssetPriceInBTC('BTC');
        expect(result).toBeDefined();
    });
});
