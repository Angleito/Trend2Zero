const request = require('supertest');
const { getApp } = require('../setup');
const marketDataService = require('../../services/marketDataService');

jest.setTimeout(30000); // Increase timeout for all tests
jest.mock('../../services/marketDataService');

describe('Market Data Controller Tests', () => {
    const baseUrl = '/api/market-data';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /assets/search', () => {
        it('should return search results from service', async () => {
            const mockResults = [{ id: 'BTC', name: 'Bitcoin' }];
            marketDataService.searchAssets.mockResolvedValue(mockResults);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`)
                .query({ q: 'bitcoin' });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResults);
        });

        it('should return 400 if query parameter is missing', async () => {
            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`);

            expect(response.status).toBe(400);
        });

        it('should handle service errors gracefully', async () => {
            marketDataService.searchAssets.mockRejectedValue(new Error('Service error'));

            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`)
                .query({ q: 'bitcoin' });

            expect(response.status).toBe(500);
        });
    });

    describe('GET /assets/popular', () => {
        it('should return popular assets from service', async () => {
            const mockAssets = [{ id: 'BTC', name: 'Bitcoin' }];
            marketDataService.getPopularAssets.mockResolvedValue(mockAssets);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/popular`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockAssets);
        });

        it('should handle service errors gracefully', async () => {
            marketDataService.getPopularAssets.mockRejectedValue(new Error('Service error'));

            const response = await request(getApp())
                .get(`${baseUrl}/assets/popular`);

            expect(response.status).toBe(500);
        });
    });

    describe('GET /assets/:symbol', () => {
        it('should return asset details from service', async () => {
            const mockAsset = { symbol: 'BTC', name: 'Bitcoin' };
            marketDataService.getAssetBySymbol.mockResolvedValue(mockAsset);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/BTC`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockAsset);
        });

        it('should return 404 if asset is not found', async () => {
            marketDataService.getAssetBySymbol.mockResolvedValue(null);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/INVALID`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /assets/:symbol/price', () => {
        it('should return current price from service', async () => {
            const mockPrice = { price: 50000, change24h: 1000 };
            marketDataService.getAssetPrice.mockResolvedValue(mockPrice);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/BTC/price`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockPrice);
        });

        it('should return 404 if price is not found', async () => {
            marketDataService.getAssetPrice.mockResolvedValue(null);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/INVALID/price`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /assets/:symbol/history', () => {
        it('should return historical data from service', async () => {
            const mockHistory = [
                { timestamp: '2023-01-01', price: 50000 }
            ];
            marketDataService.getAssetHistory.mockResolvedValue(mockHistory);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/BTC/history`)
                .query({ interval: '1d' });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockHistory);
        });

        it('should return 400 if interval parameter is missing', async () => {
            const response = await request(getApp())
                .get(`${baseUrl}/assets/BTC/history`);

            expect(response.status).toBe(400);
        });

        it('should return 404 if historical data is not found', async () => {
            marketDataService.getAssetHistory.mockResolvedValue(null);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/INVALID/history`)
                .query({ interval: '1d' });

            expect(response.status).toBe(404);
        });
    });
});
