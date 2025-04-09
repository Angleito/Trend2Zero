import apiClient from '../../lib/api/apiClient';
import * as watchlistService from '../../lib/api/watchlistService';

// Mock the API client
jest.mock('../../lib/api/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));

describe('Watchlist API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWatchlist', () => {
    it('calls the correct endpoint', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            watchlist: [
              {
                assetSymbol: 'BTC',
                assetType: 'Cryptocurrency',
                dateAdded: '2023-01-01T00:00:00.000Z'
              },
              {
                assetSymbol: 'AAPL',
                assetType: 'Stocks',
                dateAdded: '2023-01-01T00:00:00.000Z'
              }
            ]
          }
        }
      };
      apiClient.get.mockResolvedValue(mockResponse);

      // Call the function
      const result = await watchlistService.getWatchlist();

      // Assertions
      expect(apiClient.get).toHaveBeenCalledWith('/users/watchlist');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors correctly', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.get.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(watchlistService.getWatchlist()).rejects.toThrow('API Error');
    });
  });

  describe('addToWatchlist', () => {
    it('calls the correct endpoint with asset data', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            watchlist: [
              {
                assetSymbol: 'BTC',
                assetType: 'Cryptocurrency',
                dateAdded: '2023-01-01T00:00:00.000Z'
              }
            ]
          }
        }
      };
      apiClient.post.mockResolvedValue(mockResponse);

      // Call the function
      const assetData = {
        assetSymbol: 'BTC',
        assetType: 'Cryptocurrency'
      };
      const result = await watchlistService.addToWatchlist(assetData);

      // Assertions
      expect(apiClient.post).toHaveBeenCalledWith('/users/watchlist', assetData);
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors correctly', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.post.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(watchlistService.addToWatchlist({})).rejects.toThrow('API Error');
    });
  });

  describe('removeFromWatchlist', () => {
    it('calls the correct endpoint with asset symbol', async () => {
      // Mock response
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            watchlist: []
          }
        }
      };
      apiClient.delete.mockResolvedValue(mockResponse);

      // Call the function
      const result = await watchlistService.removeFromWatchlist('BTC');

      // Assertions
      expect(apiClient.delete).toHaveBeenCalledWith('/users/watchlist/BTC');
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors correctly', async () => {
      // Mock error
      const mockError = new Error('API Error');
      apiClient.delete.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(watchlistService.removeFromWatchlist('BTC')).rejects.toThrow('API Error');
    });
  });
});
