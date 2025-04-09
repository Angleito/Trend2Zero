const express = require('express');
const request = require('supertest');
const CryptoController = require('../../controllers/cryptoController');
const CoinMarketCapService = require('../../services/coinMarketCapService');

// Mock the CoinMarketCapService
jest.mock('../../services/coinMarketCapService');

describe('CryptoController', () => {
  let app;
  let mockCoinMarketCapService;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(express.json());

    // Create routes using the controller methods
    app.get('/markets', CryptoController.getMarkets);
    app.get('/coins/:id', CryptoController.getCoinDetails);
    app.get('/simple/price', CryptoController.getSimplePrices);

    // Add error handling middleware
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message
      });
    });

    // Reset mocks before each test
    jest.clearAllMocks();
    mockCoinMarketCapService = CoinMarketCapService;
  });

  describe('getMarkets', () => {
    it('should return markets successfully', async () => {
      const mockMarketData = [{ id: 1, name: 'Bitcoin' }];
      mockCoinMarketCapService.getCryptoListings.mockResolvedValue(mockMarketData);

      const response = await request(app).get('/markets');

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockMarketData);
    });

    it('should handle errors when fetching markets', async () => {
      mockCoinMarketCapService.getCryptoListings.mockRejectedValue(new Error('API Error'));
      
      const response = await request(app).get('/markets');

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Failed to retrieve crypto markets');
    });
  });

  describe('getCoinDetails', () => {
    it('should return coin details successfully', async () => {
      const mockCoinId = 'bitcoin';
      const mockCoinDetails = { id: mockCoinId, name: 'Bitcoin', price: 50000 };
      mockCoinMarketCapService.getCoinDetails.mockResolvedValue(mockCoinDetails);

      const response = await request(app).get(`/coins/${mockCoinId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockCoinDetails);
    });

    it('should handle missing coin ID', async () => {
      const response = await request(app).get('/coins/');

      expect(response.statusCode).toBe(404); // Express default for undefined route
    });

    it('should handle coin not found', async () => {
      const mockCoinId = 'nonexistent';
      mockCoinMarketCapService.getCoinDetails.mockResolvedValue(null);

      const response = await request(app).get(`/coins/${mockCoinId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cryptocurrency not found');
    });

    it('should handle errors when fetching coin details', async () => {
      const mockCoinId = 'bitcoin';
      mockCoinMarketCapService.getCoinDetails.mockRejectedValue(new Error('API Error'));

      const response = await request(app).get(`/coins/${mockCoinId}`);

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Failed to retrieve cryptocurrency details');
    });
  });

  describe('getSimplePrices', () => {
    it('should return prices successfully', async () => {
      const mockIds = 'bitcoin,ethereum';
      const mockCurrencies = 'usd,eur';
      const mockPrices = { 
        bitcoin: { usd: 50000, eur: 42000 },
        ethereum: { usd: 3000, eur: 2500 }
      };
      mockCoinMarketCapService.getSimplePrices.mockResolvedValue(mockPrices);

      const response = await request(app)
        .get('/simple/price')
        .query({ ids: mockIds, vs_currencies: mockCurrencies });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockPrices);
    });

    it('should handle missing query parameters', async () => {
      const response = await request(app).get('/simple/price');

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Cryptocurrency IDs and target currencies are required');
    });

    it('should handle errors when fetching prices', async () => {
      const mockIds = 'bitcoin,ethereum';
      const mockCurrencies = 'usd,eur';
      mockCoinMarketCapService.getSimplePrices.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/simple/price')
        .query({ ids: mockIds, vs_currencies: mockCurrencies });

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Failed to retrieve cryptocurrency prices');
    });
  });
});