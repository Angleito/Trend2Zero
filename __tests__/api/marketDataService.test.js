import apiClient from '../../lib/api/apiClient';
import * as marketDataService from '../../lib/api/marketDataService';

// Mock the API client
jest.mock('../../lib/api/apiClient', () => ({
  get: jest.fn()
}));

describe('Market Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssets', () => {
    it('calls the correct endpoint with options', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          results: 2,
          data: {
            assets: [
              { symbol: 'BTC', name: 'Bitcoin' },
              { symbol: 'ETH', name: 'Ethereum' }
            ]
          }
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const options = { type: 'Cryptocurrency', limit: 10 };
      const result = await marketDataService.getAllAssets(options);

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/assets', { params: options });
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors correctly', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.get.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(marketDataService.getAllAssets()).rejects.toThrow('API Error');
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/assets', { params: {} });
    });
  });

  describe('getAssetBySymbol', () => {
    it('calls the correct endpoint with symbol', async () => {
      const mockData = { symbol: 'BTC', name: 'Bitcoin' };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await marketDataService.getAssetBySymbol('BTC');
      
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/assets/BTC');
      expect(result).toEqual(mockData);
    });
  });

  describe('getAssetPrice', () => {
    it('calls the correct endpoint with symbol', async () => {
      const mockData = { price: 50000, change24h: 1000 };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await marketDataService.getAssetPrice('BTC');
      
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/price/BTC');
      expect(result).toEqual(mockData);
    });
  });

  describe('getHistoricalData', () => {
    it('calls the correct endpoint with symbol and options', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            symbol: 'BTC',
            dataPoints: [
              { date: '2023-01-01', price: 50000 },
              { date: '2023-01-02', price: 51000 }
            ]
          }
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const options = { days: 30, timeframe: 'daily' };
      const result = await marketDataService.getHistoricalData('BTC', options);

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/historical/BTC', { params: options });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('searchAssets', () => {
    it('calls the correct endpoint with search parameters', async () => {
      const mockResults = [{ symbol: 'BTC', name: 'Bitcoin' }];
      apiClient.get.mockResolvedValue({ data: mockResults });

      const result = await marketDataService.searchAssets('bitcoin', 'crypto', 5);
      
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/search', {
        params: { query: 'bitcoin', type: 'crypto', limit: 5 }
      });
      expect(result).toEqual(mockResults);
    });
  });

  describe('getPopularAssets', () => {
    it('calls the correct endpoint with limit', async () => {
      const mockAssets = [{ symbol: 'BTC', name: 'Bitcoin' }];
      apiClient.get.mockResolvedValue({ data: mockAssets });

      const result = await marketDataService.getPopularAssets(10);
      
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/popular', {
        params: { limit: 10 }
      });
      expect(result).toEqual(mockAssets);
    });
  });

  describe('getAssetsByType', () => {
    it('calls the correct endpoint with type and limit', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            assets: [
              { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
              { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' }
            ]
          }
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const result = await marketDataService.getAssetsByType('Cryptocurrency', 10);

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/assets/type/Cryptocurrency', {
        params: { limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAssetHistory', () => {
    it('calls the correct endpoint with parameters', async () => {
      const mockHistory = [{ timestamp: '2023-01-01', price: 50000 }];
      apiClient.get.mockResolvedValue({ data: mockHistory });

      const result = await marketDataService.getAssetHistory('BTC', { days: 30, interval: '1d' });
      
      expect(apiClient.get).toHaveBeenCalledWith('/market-data/history/BTC', {
        params: { days: 30, interval: '1d' }
      });
      expect(result).toEqual(mockHistory);
    });
  });

  describe('error handling', () => {
    it('throws errors from API client', async () => {
      const error = new Error('API Error');
      apiClient.get.mockRejectedValue(error);

      await expect(marketDataService.getAssetBySymbol('BTC')).rejects.toThrow('API Error');
    });

    it('handles null responses', async () => {
      apiClient.get.mockResolvedValue({ data: null });

      const result = await marketDataService.getAssetBySymbol('BTC');
      expect(result).toBeNull();
    });
  });
});
