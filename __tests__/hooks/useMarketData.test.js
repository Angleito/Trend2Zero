import { renderHook, waitFor } from '@testing-library/react';
import {
  useAsset,
  useAssetPrice,
  useHistoricalData,
  useAssetSearch,
  usePopularAssets,
  useAssetsByType
} from '../../lib/hooks/useMarketData';

describe('Market Data Hooks', () => {
  describe('useAsset', () => {
    it('fetches asset data correctly', async () => {
      // Mock fetch function for BTC
      const mockFetchFnBtc = jest.fn().mockResolvedValue({ symbol: 'BTC', name: 'Bitcoin' });

      // Render the hook
      const { result, rerender } = renderHook(
        ({ symbol, fetchFn }) => useAsset(symbol, fetchFn),
        {
          initialProps: {
            symbol: 'BTC',
            fetchFn: mockFetchFnBtc
          }
        }
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.asset).toBe(null);
      expect(result.current.error).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state for BTC
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toEqual({ symbol: 'BTC', name: 'Bitcoin' });
      expect(result.current.error).toBe(null);
      expect(mockFetchFnBtc).toHaveBeenCalledWith('BTC');

      // Test with a different symbol
      const mockFetchFnEth = jest.fn().mockResolvedValue({ symbol: 'ETH', name: 'Ethereum' });
      rerender({
        symbol: 'ETH',
        fetchFn: mockFetchFnEth
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state for ETH
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toEqual({ symbol: 'ETH', name: 'Ethereum' });
      expect(result.current.error).toBe(null);
      expect(mockFetchFnEth).toHaveBeenCalledWith('ETH');
    });

    it('handles errors correctly', async () => {
      // Mock fetch function to throw an error
      const mockFetchFn = jest.fn().mockRejectedValue({
        response: { data: { message: 'Asset not found' } }
      });

      // Render the hook
      const { result } = renderHook(() => useAsset('INVALID', mockFetchFn));

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the error state
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toBe(null);
      expect(result.current.error).toBe('Asset not found');
    });

    it('does not fetch when symbol is not provided', async () => {
      // Render the hook with no symbol
      const mockFetchFn = jest.fn();
      const { result } = renderHook(() => useAsset(null, mockFetchFn));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toBe(null);
      expect(mockFetchFn).not.toHaveBeenCalled();
    });
  });

  describe('useAssetPrice', () => {
    it('fetches price data correctly', async () => {
      // Define mock price data
      const mockPriceData = {
        symbol: 'BTC',
        priceInUSD: 50000,
        priceInBTC: 1
      };

      // Mock fetch function
      const mockFetchFn = jest.fn().mockResolvedValue(mockPriceData);

      // Render the hook
      const { result, rerender } = renderHook(
        ({ symbol, autoRefresh, refreshInterval, fetchFn }) =>
          useAssetPrice(symbol, autoRefresh, refreshInterval, fetchFn),
        {
          initialProps: {
            symbol: 'BTC',
            autoRefresh: false,
            refreshInterval: 60000,
            fetchFn: mockFetchFn
          }
        }
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.priceData).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.priceData).toEqual(mockPriceData);
      expect(mockFetchFn).toHaveBeenCalledWith('BTC');

      // Test with a different symbol
      const mockFetchFnEth = jest.fn().mockResolvedValue({
        symbol: 'ETH',
        priceInUSD: 2000,
        priceInBTC: 0.05
      });

      rerender({
        symbol: 'ETH',
        autoRefresh: false,
        refreshInterval: 60000,
        fetchFn: mockFetchFnEth
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state for ETH
      expect(result.current.loading).toBe(false);
      expect(result.current.priceData).toEqual({
        symbol: 'ETH',
        priceInUSD: 2000,
        priceInBTC: 0.05
      });
      expect(mockFetchFnEth).toHaveBeenCalledWith('ETH');
    });

    it('handles errors correctly', async () => {
      // Mock fetch function to throw an error
      const mockFetchFn = jest.fn().mockRejectedValue({
        response: { data: { message: 'Price not found' } }
      });

      // Render the hook
      const { result } = renderHook(() => useAssetPrice('INVALID', false, 60000, mockFetchFn));

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the error state
      expect(result.current.loading).toBe(false);
      expect(result.current.priceData).toBe(null);
      expect(result.current.error).toBe('Price not found');
    });

    it('does not fetch when symbol is not provided', async () => {
      // Mock fetch function
      const mockFetchFn = jest.fn();

      // Render the hook with no symbol
      const { result } = renderHook(() => useAssetPrice(null, false, 60000, mockFetchFn));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.priceData).toBe(null);
      expect(mockFetchFn).not.toHaveBeenCalled();
    });
  });

  describe('useHistoricalData', () => {
    it('fetches historical data correctly', async () => {
      // Mock fetch function for BTC
      const mockFetchFnBtc = jest.fn().mockResolvedValue({
        symbol: 'BTC',
        dataPoints: [
          { date: '2023-01-01', price: 50000 },
          { date: '2023-01-02', price: 51000 }
        ]
      });

      // Render the hook
      const { result, rerender } = renderHook(
        ({ symbol, options, fetchFn }) => useHistoricalData(symbol, options, fetchFn),
        {
          initialProps: {
            symbol: 'BTC',
            options: { days: 30 },
            fetchFn: mockFetchFnBtc
          }
        }
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.historicalData).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state for BTC
      expect(result.current.loading).toBe(false);
      expect(result.current.historicalData).toEqual({
        symbol: 'BTC',
        dataPoints: [
          { date: '2023-01-01', price: 50000 },
          { date: '2023-01-02', price: 51000 }
        ]
      });
      expect(mockFetchFnBtc).toHaveBeenCalledWith('BTC', { days: 30 });

      // Test with a different symbol and options
      const mockFetchFnEth = jest.fn().mockResolvedValue({
        symbol: 'ETH',
        dataPoints: [
          { date: '2023-01-01', price: 2000 },
          { date: '2023-01-02', price: 2100 }
        ]
      });

      rerender({
        symbol: 'ETH',
        options: { days: 60 },
        fetchFn: mockFetchFnEth
      });

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state for ETH
      expect(result.current.loading).toBe(false);
      expect(result.current.historicalData).toEqual({
        symbol: 'ETH',
        dataPoints: [
          { date: '2023-01-01', price: 2000 },
          { date: '2023-01-02', price: 2100 }
        ]
      });
      expect(mockFetchFnEth).toHaveBeenCalledWith('ETH', { days: 60 });
    });

    it('handles errors correctly', async () => {
      // Mock fetch function to throw an error
      const mockFetchFn = jest.fn().mockRejectedValue({
        response: { data: { message: 'Historical data not found' } }
      });

      // Render the hook
      const { result } = renderHook(() => useHistoricalData('INVALID', { days: 30 }, mockFetchFn));

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the error state
      expect(result.current.loading).toBe(false);
      expect(result.current.historicalData).toBe(null);
      expect(result.current.error).toBe('Historical data not found');
    });

    it('does not fetch when symbol is not provided', async () => {
      // Mock fetch function
      const mockFetchFn = jest.fn();

      // Render the hook with no symbol
      const { result } = renderHook(() => useHistoricalData(null, { days: 30 }, mockFetchFn));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.historicalData).toBe(null);
      expect(mockFetchFn).not.toHaveBeenCalled();
    });
  });

  describe('useAssetSearch', () => {
    it('searches assets correctly', async () => {
      // Mock fetch function
      const mockSearchFn = jest.fn().mockResolvedValue([
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' }
      ]);

      // Render the hook
      const { result } = renderHook(() => useAssetSearch(mockSearchFn));

      // Initial state
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual([]);

      // Perform a search
      result.current.search('bitcoin');

      // Wait for the search to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual([
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' }
      ]);
      expect(mockSearchFn).toHaveBeenCalledWith('bitcoin', 'all', 10);
    });

    it('does not search when query is empty', async () => {
      // Mock fetch function
      const mockSearchFn = jest.fn();

      // Render the hook
      const { result } = renderHook(() => useAssetSearch(mockSearchFn));

      // Perform a search with empty query
      result.current.search('');

      // Wait for the search to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should not call the service
      expect(mockSearchFn).not.toHaveBeenCalled();
      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe('usePopularAssets', () => {
    it('fetches popular assets correctly', async () => {
      // Mock fetch function
      const mockFetchFn = jest.fn().mockResolvedValue([
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' }
      ]);

      // Render the hook
      const { result } = renderHook(
        () => usePopularAssets(5, mockFetchFn)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.popularAssets).toEqual([]);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.popularAssets).toEqual([
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' }
      ]);
      expect(mockFetchFn).toHaveBeenCalledWith(5);
    });
  });

  describe('useAssetsByType', () => {
    it('fetches assets by type correctly', async () => {
      // Mock fetch function
      const mockFetchFn = jest.fn().mockResolvedValue([
        { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
        { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' }
      ]);

      // Render the hook
      const { result } = renderHook(
        () => useAssetsByType('Cryptocurrency', 10, mockFetchFn)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.assets).toEqual([]);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.assets).toEqual([
        { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
        { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' }
      ]);
      expect(mockFetchFn).toHaveBeenCalledWith('Cryptocurrency', 10);
    });

    it('does not fetch when type is not provided', async () => {
      // Mock fetch function
      const mockFetchFn = jest.fn();

      // Render the hook with no type
      const { result } = renderHook(() => useAssetsByType(null, 10, mockFetchFn));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.assets).toEqual([]);
      expect(mockFetchFn).not.toHaveBeenCalled();
    });
  });
});
