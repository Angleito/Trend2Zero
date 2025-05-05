import { apiClient } from '../../lib/api/apiClient';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../../lib/api/watchlistService';

jest.mock('../../lib/api/apiClient');

describe('Watchlist Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWatchlistData = [
    { symbol: 'BTC', type: 'crypto', dateAdded: '2024-03-20T00:00:00.000Z' },
    { symbol: 'AAPL', type: 'stock', dateAdded: '2024-03-19T00:00:00.000Z' }
  ];

  describe('getWatchlist', () => {
    it('should fetch watchlist successfully', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockWatchlistData });

      const result = await getWatchlist();

      expect(apiClient.get).toHaveBeenCalledWith('/users/watchlist');
      expect(result).toEqual(mockWatchlistData);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Network error';
      apiClient.get.mockRejectedValueOnce({ 
        response: { data: { message: errorMessage } }
      });

      await expect(getWatchlist()).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/users/watchlist');
    });
  });

  describe('addToWatchlist', () => {
    const symbol = 'ETH';

    it('should add asset to watchlist successfully', async () => {
      const updatedWatchlist = [...mockWatchlistData, { 
        symbol, 
        type: 'crypto', 
        dateAdded: expect.any(String) 
      }];
      
      apiClient.post.mockResolvedValueOnce({ data: updatedWatchlist });

      const result = await addToWatchlist(symbol);

      expect(apiClient.post).toHaveBeenCalledWith('/users/watchlist', { symbol });
      expect(result).toEqual(updatedWatchlist);
    });

    it('should handle API errors when adding asset', async () => {
      apiClient.post.mockRejectedValueOnce({ 
        response: { data: { message: 'Asset already in watchlist' } }
      });

      await expect(addToWatchlist(symbol)).rejects.toThrow('Asset already in watchlist');
      expect(apiClient.post).toHaveBeenCalledWith('/users/watchlist', { symbol });
    });
  });

  describe('removeFromWatchlist', () => {
    const symbol = 'BTC';

    it('should remove asset from watchlist successfully', async () => {
      const updatedWatchlist = mockWatchlistData.filter(asset => asset.symbol !== symbol);
      apiClient.delete.mockResolvedValueOnce({ data: updatedWatchlist });

      const result = await removeFromWatchlist(symbol);

      expect(apiClient.delete).toHaveBeenCalledWith(`/users/watchlist/${symbol}`);
      expect(result).toEqual(updatedWatchlist);
    });

    it('should handle API errors when removing asset', async () => {
      apiClient.delete.mockRejectedValueOnce({ 
        response: { data: { message: 'Asset not found in watchlist' } }
      });

      await expect(removeFromWatchlist(symbol)).rejects.toThrow('Asset not found in watchlist');
      expect(apiClient.delete).toHaveBeenCalledWith(`/users/watchlist/${symbol}`);
    });
  });
});
