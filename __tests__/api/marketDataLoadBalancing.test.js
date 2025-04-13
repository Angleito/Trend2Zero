import { SecureMarketDataService } from '../../lib/services/secureMarketDataService';
import coinGeckoService from '../../lib/services/coinGeckoService';
import axios from 'axios';

// Mock external dependencies
jest.mock('axios');
jest.mock('../../lib/services/coinGeckoService', () => ({
  __esModule: true,
  default: {
    getCryptoPrice: jest.fn(),
    getHistoricalData: jest.fn()
  }
}));

// Mock environment variables
const originalEnv = process.env;

describe('Market Data Load Balancing', () => {
  let secureMarketDataService;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env = {
      ...originalEnv,
      COINMARKETCAP_API_KEY: 'mock-coinmarketcap-key',
      COINGECKO_API_KEY: 'mock-coingecko-key'
    };
    
    // Create a fresh instance for each test
    secureMarketDataService = new SecureMarketDataService();
  });
  
  afterAll(() => {
    // Restore environment variables
    process.env = originalEnv;
  });
  
  describe('getAssetPriceInBTC with load balancing', () => {
    it('should use CoinMarketCap as primary provider', async () => {
      // Mock successful CoinMarketCap response
      const mockCMCResponse = {
        data: {
          data: {
            BTC: {
              name: 'Bitcoin',
              quote: {
                USD: {
                  price: 50000,
                  volume_change_24h: 5000000000,
                  percent_change_24h: 2.5,
                  last_updated: '2023-01-01T12:00:00Z'
                }
              }
            }
          }
        }
      };
      
      axios.get.mockResolvedValue(mockCMCResponse);
      
      // Call the method
      const result = await secureMarketDataService.getAssetPriceInBTC('BTC');
      
      // Should have called axios.get with CoinMarketCap URL
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('pro-api.coinmarketcap.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CMC_PRO_API_KEY': 'mock-coinmarketcap-key'
          })
        })
      );
      
      // Should not have called CoinGecko service
      expect(coinGeckoService.getCryptoPrice).not.toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 50000,
        change: 5000000000,
        changePercent: 2.5,
        priceInBTC: 1,
        priceInUSD: 50000,
        lastUpdated: '2023-01-01T12:00:00Z'
      });
    });
    
    it('should fall back to CoinGecko when CoinMarketCap fails', async () => {
      // Mock failed CoinMarketCap response
      axios.get.mockRejectedValueOnce(new Error('CoinMarketCap API error'));
      
      // Mock successful CoinGecko response
      coinGeckoService.getCryptoPrice.mockResolvedValueOnce({
        symbol: 'BTC',
        price: 51000,
        lastUpdated: '2023-01-01T12:00:00Z',
        change24h: 2.8
      });
      
      // Call the method
      const result = await secureMarketDataService.getAssetPriceInBTC('BTC');
      
      // Should have tried CoinMarketCap first (axios.get)
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('pro-api.coinmarketcap.com'),
        expect.anything()
      );
      
      // Should have fallen back to CoinGecko
      expect(coinGeckoService.getCryptoPrice).toHaveBeenCalledWith('BTC');
      
      // Verify result from CoinGecko
      expect(result).toEqual(expect.objectContaining({
        symbol: 'BTC',
        price: 51000,
        priceInUSD: 51000
      }));
    });
    
    it('should handle case when both providers fail', async () => {
      // Mock console.warn to avoid cluttering test output
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock failed CoinMarketCap response
      axios.get.mockRejectedValueOnce(new Error('CoinMarketCap API error'));
      
      // Mock failed CoinGecko response
      coinGeckoService.getCryptoPrice.mockRejectedValueOnce(new Error('CoinGecko API error'));
      
      // Call the method
      const result = await secureMarketDataService.getAssetPriceInBTC('BTC');
      
      // Should have tried both providers
      expect(axios.get).toHaveBeenCalled();
      expect(coinGeckoService.getCryptoPrice).toHaveBeenCalled();
      
      // Should return mock data
      expect(result).toEqual(expect.objectContaining({
        symbol: 'BTC',
        price: expect.any(Number)
      }));
    });
    
    it('should detect rate limiting and switch providers', async () => {
      // First call - CoinMarketCap rate limited
      axios.get.mockRejectedValueOnce({
        response: { status: 429, data: 'Too many requests' }
      });
      
      // Mock successful CoinGecko response
      coinGeckoService.getCryptoPrice.mockResolvedValueOnce({
        symbol: 'BTC',
        price: 51000,
        lastUpdated: '2023-01-01T12:00:00Z',
        change24h: 2.8
      });
      
      // Call the method
      await secureMarketDataService.getAssetPriceInBTC('BTC');
      
      // Second call should go directly to CoinGecko due to rate limiting
      coinGeckoService.getCryptoPrice.mockResolvedValueOnce({
        symbol: 'ETH',
        price: 3000,
        lastUpdated: '2023-01-01T12:00:00Z',
        change24h: 1.5
      });
      
      // Reset axios mock to verify it's not called again
      axios.get.mockReset();
      
      // Call for a different symbol
      await secureMarketDataService.getAssetPriceInBTC('ETH');
      
      // Should not have called CoinMarketCap again due to rate limiting
      expect(axios.get).not.toHaveBeenCalled();
      
      // Should have called CoinGecko again
      expect(coinGeckoService.getCryptoPrice).toHaveBeenCalledWith('ETH');
    });
  });

  describe('getHistoricalData with load balancing', () => {
    it('should use load balancing for historical data', async () => {
      // First prepare CoinGecko mock response
      const mockHistoricalData = [
        {
          date: new Date(),
          price: 50000,
          volume: 30000000000,
          open: 49000,
          high: 51000,
          low: 48000,
          close: 50000
        }
      ];
      
      coinGeckoService.getHistoricalData.mockResolvedValueOnce(mockHistoricalData);
      
      // Call the method
      const result = await secureMarketDataService.getHistoricalData('BTC', 1);
      
      // Expect either CoinMarketCap API was called or CoinGecko service was called
      // This tests that at least one provider was used
      const providerWasCalled = 
        axios.get.mock.calls.some(call => call[0].includes('api/market-data/historical')) || 
        coinGeckoService.getHistoricalData.mock.calls.length > 0;
        
      expect(providerWasCalled).toBe(true);
      
      // Result should have the right structure
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          date: expect.any(Date),
          price: expect.any(Number),
          volume: expect.any(Number)
        })
      ]));
    });
  });
});