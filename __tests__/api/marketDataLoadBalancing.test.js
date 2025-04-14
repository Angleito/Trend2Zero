import { SecureMarketDataService } from '../../lib/services/secureMarketDataService';
import coinGeckoService from '../../lib/services/coinGeckoService';
import coinMarketCapService from '../../lib/services/coinMarketCapService';

// Mock the dependent services
jest.mock('../../lib/services/coinGeckoService', () => ({
  __esModule: true,
  default: {
    getCryptoPrice: jest.fn(),
    getHistoricalData: jest.fn()
  }
}));

jest.mock('../../lib/services/coinMarketCapService', () => ({
  __esModule: true,
  default: {
    getAssetPrice: jest.fn()
  }
}));

describe('Market Data Load Balancing', () => {
  let service;
  let mockCoinGeckoService;
  let mockCoinMarketCapService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Cast the mocks to their proper types
    mockCoinGeckoService = coinGeckoService;
    mockCoinMarketCapService = coinMarketCapService;
    
    // Create a new instance of the service with mocked dependencies
    service = new SecureMarketDataService({
      coinGeckoService: mockCoinGeckoService,
      coinMarketCapService: mockCoinMarketCapService
    });
  });

  describe('getAssetPriceInBTC with load balancing', () => {
    it('should use CoinMarketCap as primary source', async () => {
      // Mock successful response from CoinMarketCap
      const mockResponse = {
        symbol: 'BTC',
        price: 50000,
        lastUpdated: '2023-01-01T12:00:00Z',
        priceInBTC: 1,
        priceInUSD: 50000
      };
      
      mockCoinMarketCapService.getAssetPrice.mockResolvedValue(mockResponse);
      
      const result = await service.getAssetPriceInBTC('BTC');
      
      expect(result).toBeTruthy();
      expect(result.symbol).toBe('BTC');
      expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalledWith('BTC');
      expect(mockCoinGeckoService.getCryptoPrice).not.toHaveBeenCalled();
    });

    it('should fallback to CoinGecko on CoinMarketCap failure', async () => {
      // Mock CoinMarketCap failure
      mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('Rate limit exceeded'));
      
      // Mock successful CoinGecko response
      const mockGeckoResponse = {
        symbol: 'BTC',
        price: 51000,
        lastUpdated: '2023-01-01T12:00:00Z',
        priceInBTC: 1,
        priceInUSD: 51000
      };
      
      mockCoinGeckoService.getCryptoPrice.mockResolvedValue(mockGeckoResponse);
      
      const result = await service.getAssetPriceInBTC('BTC');
      
      expect(result).toBeTruthy();
      expect(result.symbol).toBe('BTC');
      expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalledWith('BTC');
      expect(mockCoinGeckoService.getCryptoPrice).toHaveBeenCalledWith('BTC');
    });

    it('should detect rate limiting and switch providers', async () => {
      // First call to CoinMarketCap fails with rate limit
      mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('Rate limit exceeded'));
      
      // First call to CoinGecko succeeds
      const mockGeckoResponse1 = {
        symbol: 'BTC',
        price: 51000,
        lastUpdated: '2023-01-01T12:00:00Z',
        priceInBTC: 1,
        priceInUSD: 51000
      };
      
      mockCoinGeckoService.getCryptoPrice.mockResolvedValue(mockGeckoResponse1);
      
      // Make first request
      await service.getAssetPriceInBTC('BTC');
      
      // Second call to CoinGecko for a different asset
      const mockGeckoResponse2 = {
        symbol: 'ETH',
        price: 3000,
        lastUpdated: '2023-01-01T12:00:00Z',
        priceInBTC: 0.06,
        priceInUSD: 3000
      };
      
      mockCoinGeckoService.getCryptoPrice.mockResolvedValue(mockGeckoResponse2);
      
      // Make second request for a different asset
      await service.getAssetPriceInBTC('ETH');
      
      // Should have called CoinGecko directly for the second request
      expect(mockCoinGeckoService.getCryptoPrice).toHaveBeenCalledWith('ETH');
      expect(mockCoinMarketCapService.getAssetPrice).toHaveBeenCalledTimes(1); // Only called once for first request
    });
  });

  describe('getHistoricalData with load balancing', () => {
    it('should use CoinGecko as primary source for historical data', async () => {
      // Mock successful response
      const mockResponse = [
        { timestamp: '2023-01-01T00:00:00Z', price: 50000 }
      ];
      
      mockCoinGeckoService.getHistoricalData.mockResolvedValue(mockResponse);
      
      const result = await service.getHistoricalData('BTC', 1);
      
      expect(result).toEqual(mockResponse);
      expect(mockCoinGeckoService.getHistoricalData).toHaveBeenCalledWith('BTC', 1);
    });

    it('should handle historical data fetch failures', async () => {
      // Mock failed response
      mockCoinGeckoService.getHistoricalData.mockRejectedValue(new Error('API error'));
      
      const result = await service.getHistoricalData('BTC', 1);
      
      expect(result).toEqual([]);
      expect(mockCoinGeckoService.getHistoricalData).toHaveBeenCalledWith('BTC', 1);
    });
  });
});