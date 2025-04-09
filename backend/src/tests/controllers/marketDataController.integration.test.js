const request = require('supertest');
const app = require('../testServer');
const { 
    setupTestDatabase, 
    clearTestDatabase, 
    closeTestDatabase,
    createTestAsset 
} = require('../helpers/testDb');

// Mock the market data service
jest.mock('../../services/marketDataService');
const marketDataService = require('../../services/marketDataService');

describe('Market Data Controller Integration Tests', () => {
    let server;

    beforeAll(async () => {
        await setupTestDatabase();
        server = app.listen();
    });

    beforeEach(async () => {
        await clearTestDatabase();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await closeTestDatabase();
        server.close();
    });

    describe('GET /api/market-data/assets', () => {
        it('should return a list of assets', async () => {
            // Create test assets
            const assets = [
                await createTestAsset({ symbol: 'BTC', name: 'Bitcoin', type: 'crypto' }),
                await createTestAsset({ symbol: 'ETH', name: 'Ethereum', type: 'crypto' })
            ];

            const response = await request(server)
                .get('/api/market-data/assets')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].symbol).toBe('BTC');
            expect(response.body.data[1].symbol).toBe('ETH');
        });

        it('should filter assets by query parameters', async () => {
            await createTestAsset({ symbol: 'BTC', name: 'Bitcoin', type: 'crypto' });
            await createTestAsset({ symbol: 'AAPL', name: 'Apple Inc', type: 'stock' });

            const response = await request(server)
                .get('/api/market-data/assets?type=crypto')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].symbol).toBe('BTC');
        });
    });

    describe('GET /api/market-data/assets/search', () => {
        it('should search assets using the service', async () => {
            const mockResults = [
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'BCH', name: 'Bitcoin Cash' }
            ];
            marketDataService.searchAssets.mockResolvedValue(mockResults);

            const response = await request(server)
                .get('/api/market-data/assets/search?query=bit')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toEqual(mockResults);
            expect(marketDataService.searchAssets).toHaveBeenCalledWith('bit');
        });

        it('should return 400 if query parameter is missing', async () => {
            const response = await request(server)
                .get('/api/market-data/assets/search')
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.message).toContain('Query parameter is required');
        });

        it('should fall back to database search if API search fails', async () => {
            marketDataService.searchAssets.mockRejectedValue(new Error('API Error'));
            await createTestAsset({ symbol: 'BTC', name: 'Bitcoin' });

            const response = await request(server)
                .get('/api/market-data/assets/search?query=bit')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data[0].symbol).toBe('BTC');
        });
    });

    describe('GET /api/market-data/assets/popular', () => {
        it('should return popular assets from the service', async () => {
            const mockResults = [
                { symbol: 'BTC', name: 'Bitcoin', popularity: 100 },
                { symbol: 'ETH', name: 'Ethereum', popularity: 90 }
            ];
            marketDataService.getPopularAssets.mockResolvedValue(mockResults);

            const response = await request(server)
                .get('/api/market-data/assets/popular')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toEqual(mockResults);
            expect(marketDataService.getPopularAssets).toHaveBeenCalled();
        });

        it('should fall back to database if API call fails', async () => {
            marketDataService.getPopularAssets.mockRejectedValue(new Error('API Error'));
            await createTestAsset({ 
                symbol: 'BTC', 
                name: 'Bitcoin', 
                popularity: 100 
            });

            const response = await request(server)
                .get('/api/market-data/assets/popular')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data[0].symbol).toBe('BTC');
        });
    });

    describe('GET /api/market-data/price/:symbol', () => {
        it('should return current price for an asset', async () => {
            const mockPrice = {
                symbol: 'BTC',
                price: 50000,
                currency: 'USD'
            };
            marketDataService.getAssetPrice.mockResolvedValue(mockPrice);

            const response = await request(server)
                .get('/api/market-data/price/BTC')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toEqual(mockPrice);
            expect(marketDataService.getAssetPrice).toHaveBeenCalledWith('BTC');
        });

        it('should return 404 if asset is not found', async () => {
            marketDataService.getAssetPrice.mockRejectedValue(new Error('Asset not found'));

            const response = await request(server)
                .get('/api/market-data/price/INVALID')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.message).toContain('Asset not found');
        });
    });

    describe('GET /api/market-data/historical/:symbol', () => {
        it('should return historical prices for an asset', async () => {
            const mockData = [
                { date: '2025-01-01', price: 50000 },
                { date: '2025-01-02', price: 51000 }
            ];
            marketDataService.getHistoricalPrices.mockResolvedValue(mockData);

            const response = await request(server)
                .get('/api/market-data/historical/BTC?interval=1d')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.data).toEqual(mockData);
            expect(marketDataService.getHistoricalPrices).toHaveBeenCalledWith('BTC', '1d');
        });

        it('should return 400 if interval parameter is missing', async () => {
            const response = await request(server)
                .get('/api/market-data/historical/BTC')
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body.message).toContain('Interval parameter is required');
        });

        it('should return 404 if historical data is not found', async () => {
            marketDataService.getHistoricalPrices.mockRejectedValue(new Error('Data not found'));

            const response = await request(server)
                .get('/api/market-data/historical/INVALID?interval=1d')
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.message).toContain('Data not found');
        });
    });
});
