import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { useMarketData } from '../../lib/hooks/useMarketData';
import * as marketDataService from '../../lib/api/marketDataService';

// Mock the market data service
jest.mock('../../lib/api/marketDataService', () => ({
  getAssetBySymbol: jest.fn(),
  getAssetPrice: jest.fn(),
  getHistoricalData: jest.fn(),
  getPopularAssets: jest.fn(),
  getAssetsByType: jest.fn(),
  searchAssets: jest.fn()
}));

// Test component to interact with useMarketData hook
const TestComponent = ({ options, testFn }) => {
  const marketData = useMarketData(options);
  React.useEffect(() => {
    testFn(marketData);
  }, [marketData]);

  return null;
};

describe('Market Data Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMarketData', () => {
    it('initializes with correct default state', async () => {
      const mockTestFn = jest.fn();

      render(
        <TestComponent 
          options={{}} 
          testFn={mockTestFn} 
        />
      );

      await waitFor(() => {
        expect(mockTestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            asset: null,
            price: null,
            historicalData: null,
            popularAssets: expect.any(Array),
            searchResults: expect.any(Array),
            loading: false,
            error: null
          })
        );
      });
    });

    it('fetches market data for a specific symbol', async () => {
      const mockAsset = { id: 'test-asset', symbol: 'TEST' };
      const mockPrice = { price: 100, change: 5 };
      const mockHistoricalData = [{ date: '2023-01-01', price: 95 }];

      marketDataService.getAssetBySymbol.mockResolvedValue({ data: { asset: mockAsset } });
      marketDataService.getAssetPrice.mockResolvedValue({ data: mockPrice });
      marketDataService.getHistoricalData.mockResolvedValue({ data: mockHistoricalData });
      marketDataService.getPopularAssets.mockResolvedValue({ data: { assets: [] } });

      const mockTestFn = jest.fn();

      render(
        <TestComponent 
          options={{ symbol: 'TEST' }} 
          testFn={mockTestFn} 
        />
      );

      await waitFor(() => {
        expect(mockTestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            asset: mockAsset,
            price: mockPrice,
            historicalData: mockHistoricalData,
            loading: false,
            error: null
          })
        );
      });

      expect(marketDataService.getAssetBySymbol).toHaveBeenCalledWith('TEST');
      expect(marketDataService.getAssetPrice).toHaveBeenCalledWith('TEST');
      expect(marketDataService.getHistoricalData).toHaveBeenCalledWith('TEST');
    });

    it('handles errors during market data fetch', async () => {
      const mockError = new Error('Fetch failed');
      mockError.response = { data: { message: 'Network error' } };

      marketDataService.getAssetBySymbol.mockRejectedValue(mockError);
      marketDataService.getAssetPrice.mockRejectedValue(mockError);
      marketDataService.getHistoricalData.mockRejectedValue(mockError);
      marketDataService.getPopularAssets.mockRejectedValue(mockError);

      const mockTestFn = jest.fn();

      render(
        <TestComponent 
          options={{ symbol: 'TEST' }} 
          testFn={mockTestFn} 
        />
      );

      await waitFor(() => {
        expect(mockTestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            asset: null,
            price: null,
            historicalData: null,
            loading: false,
            error: 'Network error'
          })
        );
      });
    });

    it('fetches popular assets', async () => {
      const mockPopularAssets = [
        { id: 'asset1', symbol: 'BTC' },
        { id: 'asset2', symbol: 'ETH' }
      ];

      marketDataService.getPopularAssets.mockResolvedValue({ data: { assets: mockPopularAssets } });
      marketDataService.getAssetBySymbol.mockRejectedValue(new Error('No symbol'));
      marketDataService.getAssetPrice.mockRejectedValue(new Error('No price'));
      marketDataService.getHistoricalData.mockRejectedValue(new Error('No historical data'));

      const mockTestFn = jest.fn();

      render(
        <TestComponent 
          options={{ limit: 2 }} 
          testFn={mockTestFn} 
        />
      );

      await waitFor(() => {
        expect(mockTestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            popularAssets: mockPopularAssets,
            loading: false,
            error: null
          })
        );
      });

      expect(marketDataService.getPopularAssets).toHaveBeenCalledWith(2);
    });

    it('performs asset search', async () => {
      const mockSearchResults = [
        { id: 'search1', symbol: 'SEARCH1' },
        { id: 'search2', symbol: 'SEARCH2' }
      ];

      marketDataService.searchAssets.mockResolvedValue({ data: { assets: mockSearchResults } });
      marketDataService.getPopularAssets.mockResolvedValue({ data: { assets: [] } });

      const mockTestFn = jest.fn();

      render(
        <TestComponent 
          options={{ searchQuery: 'test' }} 
          testFn={mockTestFn} 
        />
      );

      await waitFor(() => {
        expect(mockTestFn).toHaveBeenCalledWith(
          expect.objectContaining({
            searchResults: mockSearchResults,
            loading: false,
            error: null
          })
        );
      });

      expect(marketDataService.searchAssets).toHaveBeenCalledWith('test');
    });
  });
});
