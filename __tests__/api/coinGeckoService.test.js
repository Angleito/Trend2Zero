const axios = require('axios');
const { CoinGeckoService } = require('../../lib/services/coinGeckoService');

jest.mock('axios');

describe('CoinGecko Service', () => {
  let coinGeckoService;

  beforeEach(() => {
    coinGeckoService = new CoinGeckoService('test-api-key');
    jest.clearAllMocks();
  });

  describe('getCryptoPrice', () => {
    it('should fetch crypto price from CoinGecko', async () => {
      // Mock response for BTC price
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 50000,
            usd_24h_change: 2.5,
            usd_24h_vol: 30000000000,
            usd_market_cap: 1000000000000,
            last_updated_at: 1672531200 // 2023-01-01
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await coinGeckoService.getCryptoPrice('BTC');
      
      // Verify result matches expected structure
      expect(result).toEqual({
        symbol: 'BTC',
        price: 50000,
        change24h: 2.5,
        volume24h: 30000000000,
        marketCap: 1000000000000,
        lastUpdated: '2023-01-01T00:00:00.000Z'
      });
    });
  });

  describe('getHistoricalDataRange', () => {
    it('should fetch historical data for a specific time range', async () => {
      // Mock response for historical data
      const mockResponse = {
        data: {
          prices: [
            [1638316800000, 49000], // 2021-12-01
            [1638403200000, 50000]  // 2021-12-02
          ],
          total_volumes: [
            [1638316800000, 10000000000],
            [1638403200000, 12000000000]
          ]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const from = new Date('2021-12-01T00:00:00.000Z');
      const to = new Date('2021-12-02T00:00:00.000Z');
      const result = await coinGeckoService.getHistoricalDataRange('BTC', from, to);
      
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
            from: 1638316800,
            to: 1638403200
          }
        }
      );
      
      // Verify result structure
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          timestamp: 1638316800000,
          price: 49000
        })
      );
    });

    it('should handle errors in historical data range fetch', async () => {
      // Mock an error response
      axios.get.mockRejectedValue({
        response: {
          status: 429,
          data: 'Rate limit exceeded'
        }
      });
      
      const from = new Date('2021-12-01T00:00:00.000Z');
      const to = new Date('2021-12-02T00:00:00.000Z');
      const result = await coinGeckoService.getHistoricalDataRange('BTC', from, to);
      
      // Should return empty array on error
      expect(result).toEqual([]);
    });
  });

  describe('getOHLCData', () => {
    it('should fetch OHLC data for a cryptocurrency', async () => {
      // Mock response for OHLC data
      const mockResponse = {
        data: [
          [1638316800000, 49000, 50000, 48000, 49500],
          [1638403200000, 49500, 51000, 49000, 50000]
        ]
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const result = await coinGeckoService.getOHLCData('BTC', 30);
      
      // Verify axios was called with the correct URL and params
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/bitcoin/ohlc',
        expect.objectContaining({
          headers: expect.any(Object),
          params: {
            vs_currency: 'usd',
            days: '30'
          }
        })
      );
      
      // Verify result structure
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: 1638316800000,
        open: 49000,
        high: 50000,
        low: 48000,
        close: 49500
      });
    });

    it('should handle errors in OHLC data fetch', async () => {
      // Mock an error response
      axios.get.mockRejectedValue({
        response: {
          status: 429,
          data: 'Rate limit exceeded'
        }
      });
      
      const result = await coinGeckoService.getOHLCData('BTC', 30);
      
      // Should return empty array on error
      expect(result).toEqual([]);
    });
  });
});