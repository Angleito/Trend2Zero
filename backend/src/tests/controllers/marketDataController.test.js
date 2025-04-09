const request = require('supertest');
const { getApp } = require('../setup');
const { createTestAsset, clearTestData } = require('../helpers/testDb');
const marketDataService = require('../../services/marketDataService');

jest.mock('../../services/marketDataService');

describe('Market Data Controller Tests', () => {
    const baseUrl = '/api/market-data';

    beforeEach(async () => {
        await clearTestData();
        jest.clearAllMocks();
    });

    describe('GET /assets/search', () => {
        it('should return search results from service', async () => {
            const query = 'bitcoin';
            marketDataService.searchAssets.mockResolvedValueOnce([
                { symbol: 'BTC', name: 'Bitcoin' }
            ]);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`)
                .query({ q: query });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(marketDataService.searchAssets).toHaveBeenCalledWith(query);
        });

        it('should return 400 if query parameter is missing', async () => {
            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Query parameter is required');
        });

        it('should fall back to database search if API search fails', async () => {
            const query = 'bitcoin';
            marketDataService.searchAssets.mockRejectedValueOnce(new Error('API Error'));
            await createTestAsset({ symbol: 'BTC', name: 'Bitcoin' });

            const response = await request(getApp())
                .get(`${baseUrl}/assets/search`)
                .query({ q: query });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('GET /assets/popular', () => {
        it('should return popular assets from the service', async () => {
            marketDataService.getPopularAssets.mockResolvedValueOnce([
                { symbol: 'BTC', name: 'Bitcoin', popularity: 100 },
                { symbol: 'ETH', name: 'Ethereum', popularity: 90 }
            ]);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/popular`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(marketDataService.getPopularAssets).toHaveBeenCalled();
        });

        it('should fall back to database if API call fails', async () => {
            marketDataService.getPopularAssets.mockRejectedValueOnce(new Error('API Error'));
            await createTestAsset({ symbol: 'BTC', name: 'Bitcoin', popularity: 100 });

            const response = await request(getApp())
                .get(`${baseUrl}/assets/popular`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('GET /assets/:symbol/price', () => {
        it('should return current price for an asset', async () => {
            const symbol = 'BTC';
            marketDataService.getAssetPrice.mockResolvedValueOnce({
                symbol,
                price: 50000,
                currency: 'USD'
            });

            const response = await request(getApp())
                .get(`${baseUrl}/assets/${symbol}/price`);

            expect(response.status).toBe(200);
            expect(response.body.data.price).toBe(50000);
            expect(marketDataService.getAssetPrice).toHaveBeenCalledWith(symbol);
        });

        it('should return 404 if asset is not found', async () => {
            const symbol = 'INVALID';
            marketDataService.getAssetPrice.mockRejectedValueOnce(new Error('Asset not found'));

            const response = await request(getApp())
                .get(`${baseUrl}/assets/${symbol}/price`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /assets/:symbol/history', () => {
        it('should return historical prices for an asset', async () => {
            const symbol = 'BTC';
            const interval = '1d';
            marketDataService.getHistoricalPrices.mockResolvedValueOnce([
                { date: '2025-01-01', price: 50000 },
                { date: '2025-01-02', price: 51000 }
            ]);

            const response = await request(getApp())
                .get(`${baseUrl}/assets/${symbol}/history`)
                .query({ interval });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith(symbol, interval);
        });

        it('should return 400 if interval parameter is missing', async () => {
            const symbol = 'BTC';
            const response = await request(getApp())
                .get(`${baseUrl}/assets/${symbol}/history`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Interval parameter is required');
        });

        it('should return 404 if historical data is not found', async () => {
            const symbol = 'INVALID';
            const interval = '1d';
            marketDataService.getHistoricalPrices.mockRejectedValueOnce(new Error('Data not found'));

            const response = await request(getApp())
                .get(`${baseUrl}/assets/${symbol}/history`)
                .query({ interval });

            expect(response.status).toBe(404);
        });
    });
});
