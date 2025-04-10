import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAsset,
  useAssetPrice,
  useHistoricalData,
  useAssetSearch,
  usePopularAssets,
  useAssetsByType
} from '../../lib/hooks/useMarketData';
import * as marketDataService from '../../lib/api/marketDataService';

// Mock the market data service
jest.mock('../../lib/api/marketDataService');

describe('Market Data Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAsset', () => {
    it('fetches asset data correctly', async () => {
      // Mock the service response
      const mockAsset = { symbol: 'BTC', name: 'Bitcoin' };
      marketDataService.getAssetBySymbol.mockResolvedValue({
        data: { asset: mockAsset }
      });

      // Render the hook
      const { result, rerender } = renderHook(
        (props) => useAsset(props),
        { initialProps: 'BTC' }
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.asset).toBe(null);
      expect(result.current.error).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toEqual(mockAsset);
      expect(result.current.error).toBe(null);
      expect(marketDataService.getAssetBySymbol).toHaveBeenCalledWith('BTC');

      // Test with a different symbol
      marketDataService.getAssetBySymbol.mockResolvedValue({
        data: { asset: { symbol: 'ETH', name: 'Ethereum' } }
      });

      rerender('ETH');

      // Wait for the async operation to complete
      await waitForNextUpdate();

      expect(marketDataService.getAssetBySymbol).toHaveBeenCalledWith('ETH');
    });

    it('handles errors correctly', async () => {
      // Mock the service to throw an error
      const mockError = new Error('Failed to fetch asset');
      mockError.response = { data: { message: 'Asset not found' } };
      marketDataService.getAssetBySymbol.mockRejectedValue(mockError);

      // Render the hook
      const { result } = renderHook(() => useAsset('INVALID'));

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the error state
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toBe(null);
      expect(result.current.error).toBe('Asset not found');
    });

    it('does not fetch when symbol is not provided', async () => {
      // Render the hook with no symbol
      const { result } = renderHook(() => useAsset(null));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.asset).toBe(null);
      expect(marketDataService.getAssetBySymbol).not.toHaveBeenCalled();
    });
  });

  describe('useAssetPrice', () => {
    it('fetches price data correctly', async () => {
      // Mock the service response
      const mockPriceData = {
        symbol: 'BTC',
        priceInUSD: 50000,
        priceInBTC: 1
      };
      marketDataService.getAssetPrice.mockResolvedValue({
        data: mockPriceData
      });

      // Render the hook
      const { result } = renderHook(
        () => useAssetPrice('BTC', false)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.priceData).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.priceData).toEqual({ data: mockPriceData });
      expect(marketDataService.getAssetPrice).toHaveBeenCalledWith('BTC');
    });

    it('refetches data when refetch is called', async () => {
      // Mock the service response
      marketDataService.getAssetPrice.mockResolvedValue({
        data: { symbol: 'BTC', priceInUSD: 50000 }
      });

      // Render the hook
      const { result } = renderHook(
        () => useAssetPrice('BTC', false)
      );

      // Wait for the initial fetch to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Clear the mock to track the next call
      marketDataService.getAssetPrice.mockClear();

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      // Check that the service was called again
      expect(marketDataService.getAssetPrice).toHaveBeenCalledWith('BTC');
    });

    // Additional tests for auto-refresh functionality would go here
  });

  describe('useHistoricalData', () => {
    it('fetches historical data correctly', async () => {
      // Mock the service response
      const mockHistoricalData = {
        symbol: 'BTC',
        dataPoints: [
          { date: '2023-01-01', price: 50000 },
          { date: '2023-01-02', price: 51000 }
        ]
      };
      marketDataService.getHistoricalData.mockResolvedValue({
        data: mockHistoricalData
      });

      // Render the hook
      const { result } = renderHook(
        () => useHistoricalData('BTC', { days: 30 })
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.historicalData).toBe(null);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.historicalData).toEqual({ data: mockHistoricalData });
      expect(marketDataService.getHistoricalData).toHaveBeenCalledWith('BTC', { days: 30 });
    });
  });

  describe('useAssetSearch', () => {
    it('searches assets correctly', async () => {
      // Mock the service response
      const mockSearchResults = {
        assets: [
          { symbol: 'BTC', name: 'Bitcoin' },
          { symbol: 'ETH', name: 'Ethereum' }
        ]
      };
      marketDataService.searchAssets.mockResolvedValue({
        data: mockSearchResults
      });

      // Render the hook
      const { result } = renderHook(() => useAssetSearch());

      // Initial state
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual([]);

      // Perform a search
      act(() => {
        result.current.search('bitcoin');
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual(mockSearchResults.assets);
      expect(marketDataService.searchAssets).toHaveBeenCalledWith('bitcoin', 'all', 10);
    });

    it('does not search when query is empty', async () => {
      // Render the hook
      const { result } = renderHook(() => useAssetSearch());

      // Perform a search with empty query
      act(() => {
        result.current.search('');
      });

      // Should not call the service
      expect(marketDataService.searchAssets).not.toHaveBeenCalled();
      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe('usePopularAssets', () => {
    it('fetches popular assets correctly', async () => {
      // Mock the service response
      const mockPopularAssets = {
        assets: [
          { symbol: 'BTC', name: 'Bitcoin' },
          { symbol: 'ETH', name: 'Ethereum' }
        ]
      };
      marketDataService.getPopularAssets.mockResolvedValue({
        data: mockPopularAssets
      });

      // Render the hook
      const { result } = renderHook(
        () => usePopularAssets(5)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.popularAssets).toEqual([]);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.popularAssets).toEqual(mockPopularAssets.assets);
      expect(marketDataService.getPopularAssets).toHaveBeenCalledWith(5);
    });
  });

  describe('useAssetsByType', () => {
    it('fetches assets by type correctly', async () => {
      // Mock the service response
      const mockAssets = {
        assets: [
          { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency' },
          { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency' }
        ]
      };
      marketDataService.getAssetsByType.mockResolvedValue({
        data: mockAssets
      });

      // Render the hook
      const { result } = renderHook(
        () => useAssetsByType('Cryptocurrency', 10)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.assets).toEqual([]);

      // Wait for the async operation to complete
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Check the final state
      expect(result.current.loading).toBe(false);
      expect(result.current.assets).toEqual(mockAssets.assets);
      expect(marketDataService.getAssetsByType).toHaveBeenCalledWith('Cryptocurrency', 10);
    });

    it('does not fetch when type is not provided', async () => {
      // Render the hook with no type
      const { result } = renderHook(() => useAssetsByType(null));

      // Should not be loading
      expect(result.current.loading).toBe(false);
      expect(result.current.assets).toEqual([]);
      expect(marketDataService.getAssetsByType).not.toHaveBeenCalled();
    });
  });
});
