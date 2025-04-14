const request = require('supertest');
const { getApp } = require('../setup');
const coinMarketCapService = require('../../services/coinMarketCapService');

jest.mock('../../services/coinMarketCapService');
jest.setTimeout(30000); // Increase timeout for tests

describe('Crypto Controller', () => {
    // Mock the service functions
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe('GET /api/crypto/markets', () => {
        it('should return markets data successfully', async () => {
            const mockMarkets = [
                { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }
            ];
            
            coinMarketCapService.getCryptoListings = jest.fn().mockResolvedValue(mockMarkets);

            const response = await request(getApp())
                .get('/api/crypto/markets');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockMarkets);
        });

        it('should handle service errors', async () => {
            coinMarketCapService.getCryptoListings = jest.fn().mockRejectedValue(new Error('Service error'));

            const response = await request(getApp())
                .get('/api/crypto/markets');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching crypto markets');
        });
    });

    describe('GET /api/crypto/coin/:id', () => {
        it('should return coin details successfully', async () => {
            const mockCoin = {
                id: 'bitcoin',
                symbol: 'BTC',
                name: 'Bitcoin'
            };
            
            coinMarketCapService.getCoinDetails = jest.fn().mockResolvedValue(mockCoin);

            const response = await request(getApp())
                .get('/api/crypto/coin/bitcoin');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockCoin);
        });

        it('should handle missing coin', async () => {
            coinMarketCapService.getCoinDetails = jest.fn().mockResolvedValue(null);

            const response = await request(getApp())
                .get('/api/crypto/coin/invalid');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Coin not found');
        });

        it('should handle service errors', async () => {
            coinMarketCapService.getCoinDetails = jest.fn().mockRejectedValue(new Error('Service error'));

            const response = await request(getApp())
                .get('/api/crypto/coin/bitcoin');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching coin details');
        });
    });

    describe('GET /api/crypto/simple/price', () => {
        it('should return prices successfully', async () => {
            const mockPrices = {
                bitcoin: { usd: 50000 },
                ethereum: { usd: 3000 }
            };
            
            coinMarketCapService.getSimplePrices = jest.fn().mockResolvedValue(mockPrices);

            const response = await request(getApp())
                .get('/api/crypto/simple/price')
                .query({
                    ids: 'bitcoin,ethereum',
                    vs_currencies: 'usd'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockPrices);
        });

        it('should require query parameters', async () => {
            const response = await request(getApp())
                .get('/api/crypto/simple/price');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Missing required parameters');
        });

        it('should handle service errors', async () => {
            coinMarketCapService.getSimplePrices = jest.fn().mockRejectedValue(new Error('Service error'));

            const response = await request(getApp())
                .get('/api/crypto/simple/price')
                .query({
                    ids: 'bitcoin,ethereum',
                    vs_currencies: 'usd'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching prices');
        });
    });
});