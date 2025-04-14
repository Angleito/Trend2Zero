const request = require('supertest');
const { createTestAsset } = require('../helpers/testDb');
const { getApp } = require('../setup.cjs');
const { marketDataService } = require('../../services/marketDataService');

describe('Market Data Controller Integration Tests', () => {
    afterAll(() => {
        const { serverInstance } = require('../setup.cjs');
        if (serverInstance && serverInstance.close) {
            serverInstance.close();
        }
    });

    describe('GET /api/market-data/assets', () => {
        it('should return a list of assets', async () => {
            await createTestAsset({ symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', currentPrice: 150.0, lastUpdated: new Date() });
            await createTestAsset({ symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stocks', currentPrice: 2800.0, lastUpdated: new Date() });

            const response = await request(getApp())
                .get('/api/market-data/assets')
                .expect(200);

            expect(response.body.data).toBeDefined();
        });

        it('should filter assets by query parameters', async () => {
            await createTestAsset({ symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', currentPrice: 150.0, lastUpdated: new Date() });
            await createTestAsset({ symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stocks', currentPrice: 2800.0, lastUpdated: new Date() });

            const response = await request(getApp())
                .get('/api/market-data/assets?type=stocks')
                .expect(200);

            expect(response.body.data).toBeDefined();
        });
    });

    describe('GET /api/market-data/assets/search', () => {
        it('should search assets using the service', async () => {
            const mockResults = [
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.' }
            ];
            jest.spyOn(marketDataService, 'searchAssets').mockResolvedValue(mockResults);

            const response = await request(getApp())
                .get('/api/market-data/assets/search?query=app')
                .expect(200);

            expect(response.body.data).toEqual(mockResults);
            expect(marketDataService.searchAssets).toHaveBeenCalledWith('app');
        });

        it('should return 400 if query parameter is missing', async () => {
            const response = await request(getApp())
                .get('/api/market-data/assets/search')
                .expect(400);

            expect(response.body.message).toContain('Query parameter is required');
        });

        it('should fall back to database search if API search fails', async () => {
            jest.spyOn(marketDataService, 'searchAssets').mockRejectedValue(new Error('API Error'));
            await createTestAsset({ symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', currentPrice: 150.0, lastUpdated: new Date() });

            const response = await request(getApp())
                .get('/api/market-data/assets/search?query=app')
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data[0].symbol).toBe('AAPL');
        });
    });

    describe('GET /api/market-data/assets/popular', () => {
        it('should return popular assets from the service', async () => {
            const mockResults = [
                { symbol: 'AAPL', name: 'Apple Inc.', popularity: 100 },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', popularity: 90 }
            ];
            jest.spyOn(marketDataService, 'getPopularAssets').mockResolvedValue(mockResults);

            const response = await request(getApp())
                .get('/api/market-data/assets/popular')
                .expect(200);

            expect(response.body.data).toEqual(mockResults);
            expect(marketDataService.getPopularAssets).toHaveBeenCalled();
        });

        it('should fall back to database if API call fails', async () => {
            jest.spyOn(marketDataService, 'getPopularAssets').mockRejectedValue(new Error('API Error'));
            await createTestAsset({ symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', currentPrice: 150.0, lastUpdated: new Date() });

            const response = await request(getApp())
                .get('/api/market-data/assets/popular')
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data[0].symbol).toBe('AAPL');
        });
    });

    describe('GET /api/market-data/price/:symbol', () => {
        it('should return current price for an asset', async () => {
            const mockPrice = {
                symbol: 'AAPL',
                price: 150.0,
                currency: 'USD'
            };
            jest.spyOn(marketDataService, 'getAssetPrice').mockResolvedValue(mockPrice);

            const response = await request(getApp())
                .get('/api/market-data/price/AAPL')
                .expect(200);

            expect(response.body.data).toEqual(mockPrice);
            expect(marketDataService.getAssetPrice).toHaveBeenCalledWith('AAPL');
        });

        it('should return 404 if asset is not found', async () => {
            jest.spyOn(marketDataService, 'getAssetPrice').mockRejectedValue(new Error('Asset not found'));

            const response = await request(getApp())
                .get('/api/market-data/price/INVALID')
                .expect(404);

            expect(response.body.message).toContain('Asset not found');
        });
    });

    describe('GET /api/market-data/historical/:symbol', () => {
        it('should return historical prices for an asset', async () => {
            const mockData = [
                { date: new Date(), price: 145.0 }
            ];
            jest.spyOn(marketDataService, 'getHistoricalPrices').mockResolvedValue(mockData);

            const response = await request(getApp())
                .get('/api/market-data/historical/AAPL?interval=1d')
                .expect(200);

            expect(response.body.data).toEqual(mockData);
            expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith('AAPL', '1d');
        });

        it('should return 400 if interval parameter is missing', async () => {
            const response = await request(getApp())
                .get('/api/market-data/historical/AAPL')
                .expect(400);

            expect(response.body.message).toContain('Interval parameter is required');
        });

        it('should return 404 if historical data is not found', async () => {
            jest.spyOn(marketDataService, 'getHistoricalPrices').mockRejectedValue(new Error('Data not found'));

            const response = await request(getApp())
                .get('/api/market-data/historical/INVALID?interval=1d')
                .expect(404);

            expect(response.body.message).toContain('Data not found');
        });
    });
});
