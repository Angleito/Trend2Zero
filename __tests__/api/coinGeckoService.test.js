import axios from 'axios';
import { CoinGeckoService } from '../../lib/services/coinGeckoService';

// Mock axios
jest.mock('axios');

describe('CoinGecko Service', () => {
  let coinGeckoService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance for each test
    coinGeckoService = new CoinGeckoService('test-api-key');
  });

  describe('getCryptoPrice', () => {
    it('should fetch price data for a given cryptocurrency symbol', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 50000,
            usd_24h_vol: 30000000000,
            usd_24h_change: 2.5,
            usd_market_cap: 950000000000,
            last_updated_at: 1638360000
          }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Call the method
      const result = await coinGeckoService.getCryptoPrice('BTC');

      // Verify axios was called with the correct params
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          headers: {
            'Accept': 'application/json',
            'x-cg-pro-api-key': 'test-api-key'
          },
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true',
            include_last_updated_at: 'true'
          }
        }
      );

      // Verify result
      expect(result).toEqual({
        symbol: 'BTC',
        price: 50000,
        lastUpdated: expect.any(String),
        volume24h: 30000000000,
        marketCap: 950000000000,
        change24h: 2.5
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock error response
      const errorMessage = 'API Error';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockRejectedValue(new Error(errorMessage));

      // Call the method and expect it to throw
      await expect(coinGeckoService.getCryptoPrice('BTC')).rejects.toThrow();
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getHistoricalData', () => {
    it('should use hourly interval for 30 days or less', async () => {
      // Mock successful response with prices and volumes
      const mockResponse = {
        data: {
          prices: [
            [1638360000000, 50000],
            [1638446400000, 51000]
          ],
          total_volumes: [
            [1638360000000, 30000000000],
            [1638446400000, 32000000000]
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Call the method with 30 days
      await coinGeckoService.getHistoricalData('BTC', 30);

      // Verify axios was called with hourly interval
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
        expect.objectContaining({
          params: expect.objectContaining({
            interval: 'hourly'
          })
        })
      );
    });

    it('should use daily interval for more than 30 days', async () => {
      // Mock successful response with prices and volumes
      const mockResponse = {
        data: {
          prices: [
            [1638360000000, 50000],
            [1638446400000, 51000]
          ],
          total_volumes: [
            [1638360000000, 30000000000],
            [1638446400000, 32000000000]
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Call the method with 31 days
      await coinGeckoService.getHistoricalData('BTC', 31);

      // Verify axios was called with daily interval
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
        expect.objectContaining({
          params: expect.objectContaining({
            interval: 'daily'
          })
        })
      );
    });
  });

  describe('getHistoricalDataRange', () => {
    it('should fetch historical data for a specific time range', async () => {
      // Mock successful response with prices and volumes
      const mockResponse = {
        data: {
          prices: [
            [1638360000000, 50000],
            [1638446400000, 51000]
          ],
          total_volumes: [
            [1638360000000, 30000000000],
            [1638446400000, 32000000000]
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Call the method with specific timestamps
      const fromTimestamp = 1638360000;
      const toTimestamp = 1638446400;
      const result = await coinGeckoService.getHistoricalDataRange('BTC', fromTimestamp, toTimestamp);

      // Verify axios was called with the correct params
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range',
        {
          headers: {
            'Accept': 'application/json',
            'x-cg-pro-api-key': 'test-api-key'
          },
          params: {
            vs_currency: 'usd',
            from: fromTimestamp,
            to: toTimestamp
          }
        }
      );

      // Verify result structure
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: expect.any(Date),
        price: 50000,
        open: expect.any(Number),
        high: expect.any(Number),
        low: expect.any(Number),
        close: 50000,
        volume: 30000000000
      });
    });

    it('should handle errors in historical data range fetch', async () => {
      // Mock error response
      const errorMessage = 'API Error';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockRejectedValue(new Error(errorMessage));

      // Call the method and expect it to throw
      await expect(
        coinGeckoService.getHistoricalDataRange('BTC', 1638360000, 1638446400)
      ).rejects.toThrow();
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getOHLCData', () => {
    it('should fetch OHLC data for a given cryptocurrency', async () => {
      // Mock successful response with OHLC data
      const mockResponse = {
        data: [
          [1638360000000, 48000, 50000, 47000, 49000],
          [1638446400000, 49000, 52000, 48500, 51000]
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      // Call the method
      const result = await coinGeckoService.getOHLCData('BTC', 30);

      // Verify axios was called with the correct params
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc',
        {
          headers: {
            'Accept': 'application/json',
            'x-cg-pro-api-key': 'test-api-key'
          },
          params: {
            vs_currency: 'usd',
            days: '30'
          }
        }
      );

      // Verify result structure
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: 1638360000000,
        open: 48000,
        high: 50000,
        low: 47000,
        close: 49000
      });
    });

    it('should use the closest valid days value', async () => {
      // Mock successful response with OHLC data
      const mockResponse = {
        data: [
          [1638360000000, 48000, 50000, 47000, 49000]
        ]
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      axios.get.mockResolvedValue(mockResponse);

      // Call the method with an invalid days value
      await coinGeckoService.getOHLCData('BTC', 45);

      // Verify console warning was called
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid days value: 45')
      );

      // Verify axios was called with the closest valid value
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc',
        expect.objectContaining({
          params: expect.objectContaining({
            days: '30'
          })
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors in OHLC data fetch', async () => {
      // Mock error response
      const errorMessage = 'API Error';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockRejectedValue(new Error(errorMessage));

      // Call the method and expect it to throw
      await expect(coinGeckoService.getOHLCData('BTC', 30)).rejects.toThrow();
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  // Other existing tests (searchCrypto, getMarketOverview, etc.) remain unchanged
});