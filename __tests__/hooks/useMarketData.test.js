import { renderHook, act } from '@testing-library/react-hooks';
import { useMarketData } from '../../hooks/useMarketData';
import * as marketDataService from '../../lib/api/marketDataService';

jest.mock('../../lib/api/marketDataService');
// Add mock for apiClient to prevent interceptor errors
jest.mock('../../lib/api/apiClient', () => ({
  interceptors: {
    request: {
      use: jest.fn(), // Mock the 'use' function
    },
    response: {
      use: jest.fn(), // Also mock response interceptor if needed
    },
  },
  // Mock other apiClient methods if they were directly used (they aren't here)
  get: jest.fn(), 
}));

describe('useMarketData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockData = {
        symbol: 'BTC',
        price: 50000,
        change24h: 2.5
    };

    it('fetches market data on mount', async () => {
        marketDataService.getMarketData.mockResolvedValueOnce(mockData);

        const { result, waitForNextUpdate } = renderHook(() => 
            useMarketData('BTC')
        );

        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBeNull();

        await waitForNextUpdate();

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
        expect(marketDataService.getMarketData).toHaveBeenCalledWith('BTC');
    });

    it('handles errors during fetch', async () => {
        const error = new Error('Failed to fetch');
        marketDataService.getMarketData.mockRejectedValueOnce(error);

        const { result, waitForNextUpdate } = renderHook(() => 
            useMarketData('BTC')
        );

        expect(result.current.loading).toBe(true);

        await waitForNextUpdate();

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe(error.message);
    });

    it('refreshes data when refresh is called', async () => {
        const updatedData = { ...mockData, price: 51000 };
        marketDataService.getMarketData
            .mockResolvedValueOnce(mockData)
            .mockResolvedValueOnce(updatedData);

        const { result, waitForNextUpdate } = renderHook(() => 
            useMarketData('BTC')
        );

        await waitForNextUpdate();
        expect(result.current.data).toEqual(mockData);

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.data).toEqual(updatedData);
        expect(marketDataService.getMarketData).toHaveBeenCalledTimes(2);
    });

    it('updates data periodically when refreshInterval is set', async () => {
        jest.useFakeTimers();
        marketDataService.getMarketData
            .mockResolvedValueOnce(mockData)
            .mockResolvedValueOnce({ ...mockData, price: 51000 });

        const { result, waitForNextUpdate } = renderHook(() => 
            useMarketData('BTC', { refreshInterval: 5000 })
        );

        await waitForNextUpdate();
        expect(result.current.data).toEqual(mockData);

        act(() => {
            jest.advanceTimersByTime(5000);
        });

        await waitForNextUpdate();
        expect(result.current.data).toEqual({ ...mockData, price: 51000 });
        
        jest.useRealTimers();
    });

    it('does not fetch initially when initialFetch is false', () => {
        renderHook(() => useMarketData('BTC', { initialFetch: false }));
        expect(marketDataService.getMarketData).not.toHaveBeenCalled();
    });
});
