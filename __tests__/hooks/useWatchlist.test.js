import { renderHook, act, waitFor } from '@testing-library/react';
import { useWatchlist } from '../../lib/hooks/useWatchlist';
import { useWatchlistStore } from '../../lib/stores/watchlistStore';
import * as watchlistService from '../../lib/api/watchlistService';
import { useAuth } from '../../lib/hooks/useAuth';

// Mock the necessary modules
jest.mock('../../lib/api/watchlistService');
jest.mock('../../lib/api/apiClient', () => ({
  interceptors: {
    request: {
      use: jest.fn()
    }
  }
}));

jest.mock('../../lib/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('useWatchlist Hook', () => {
  const mockWatchlist = [
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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useWatchlistStore.getState().reset();
    useAuth.mockReturnValue({
      user: { _id: '123' },
      isAuthenticated: true
    });
    watchlistService.getWatchlist.mockResolvedValue({
      data: { watchlist: mockWatchlist }
    });
  });

  it('fetches watchlist data on mount when authenticated', async () => {
    const { result } = renderHook(() => useWatchlist());

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.watchlist).toEqual([]);

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the final state
    expect(result.current.watchlist).toEqual(mockWatchlist);
    expect(watchlistService.getWatchlist).toHaveBeenCalled();
  });

  it('does not fetch watchlist data when not authenticated', async () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    const { result } = renderHook(() => useWatchlist());

    // Should not be loading and have empty watchlist
    expect(result.current.loading).toBe(false);
    expect(result.current.watchlist).toEqual([]);
    expect(watchlistService.getWatchlist).not.toHaveBeenCalled();
  });

  it('adds asset to watchlist correctly', async () => {
    const updatedWatchlist = [
      ...mockWatchlist,
      {
        assetSymbol: 'ETH',
        assetType: 'Cryptocurrency',
        dateAdded: '2023-01-02T00:00:00.000Z'
      }
    ];
    
    watchlistService.addToWatchlist.mockResolvedValue({
      data: { watchlist: updatedWatchlist }
    });

    const { result } = renderHook(() => useWatchlist());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Add to watchlist
    await act(async () => {
      await result.current.addToWatchlist('ETH', 'Cryptocurrency');
    });

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the final state
    expect(result.current.watchlist).toEqual(updatedWatchlist);
    expect(watchlistService.addToWatchlist).toHaveBeenCalledWith({
      assetSymbol: 'ETH',
      assetType: 'Cryptocurrency'
    });
  });

  it('removes asset from watchlist correctly', async () => {
    const updatedWatchlist = [mockWatchlist[1]]; // Only AAPL remains
    
    watchlistService.removeFromWatchlist.mockResolvedValue({
      data: { watchlist: updatedWatchlist }
    });

    const { result } = renderHook(() => useWatchlist());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Remove from watchlist
    await act(async () => {
      await result.current.removeFromWatchlist('BTC');
    });

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the final state
    expect(result.current.watchlist).toEqual(updatedWatchlist);
    expect(watchlistService.removeFromWatchlist).toHaveBeenCalledWith('BTC');
  });

  it('checks if asset is in watchlist correctly', async () => {
    const { result } = renderHook(() => useWatchlist());

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check if assets are in watchlist
    expect(result.current.isInWatchlist('BTC')).toBe(true);
    expect(result.current.isInWatchlist('AAPL')).toBe(true);
    expect(result.current.isInWatchlist('ETH')).toBe(false);
  });

  it('handles errors when fetching watchlist', async () => {
    // Mock error
    const mockError = new Error('API Error');
    watchlistService.getWatchlist.mockRejectedValue(mockError);

    const { result } = renderHook(() => useWatchlist());

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the error state
    expect(result.current.error).toBe('Failed to fetch watchlist');
    expect(result.current.watchlist).toEqual([]);
  });

  it('handles errors when adding to watchlist', async () => {
    // Mock initial load
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock error for add
    const mockError = new Error('API Error');
    watchlistService.addToWatchlist.mockRejectedValue(mockError);

    // Add to watchlist
    await act(async () => {
      try {
        await result.current.addToWatchlist('ETH', 'Cryptocurrency');
      } catch (error) {
        // Expected to throw
      }
    });

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the error state
    expect(result.current.error).toBe('Failed to add to watchlist');
    expect(result.current.watchlist).toEqual(mockWatchlist); // Unchanged
  });

  it('handles errors when removing from watchlist', async () => {
    // Mock initial load
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock error for remove
    const mockError = new Error('API Error');
    watchlistService.removeFromWatchlist.mockRejectedValue(mockError);

    // Remove from watchlist
    await act(async () => {
      try {
        await result.current.removeFromWatchlist('BTC');
      } catch (error) {
        // Expected to throw
      }
    });

    // Wait for the async operation to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Check the error state
    expect(result.current.error).toBe('Failed to remove from watchlist');
    expect(result.current.watchlist).toEqual(mockWatchlist); // Unchanged
  });

  it('throws error when trying to add to watchlist while not authenticated', async () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    const { result } = renderHook(() => useWatchlist());

    // Try to add to watchlist
    await expect(
      act(async () => {
        await result.current.addToWatchlist('ETH', 'Cryptocurrency');
      })
    ).rejects.toThrow('You must be logged in to add to watchlist');
    
    expect(watchlistService.addToWatchlist).not.toHaveBeenCalled();
  });

  it('throws error when trying to remove from watchlist while not authenticated', async () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    const { result } = renderHook(() => useWatchlist());

    // Try to remove from watchlist
    await expect(
      act(async () => {
        await result.current.removeFromWatchlist('BTC');
      })
    ).rejects.toThrow('You must be logged in to remove from watchlist');
    
    expect(watchlistService.removeFromWatchlist).not.toHaveBeenCalled();
  });
});
