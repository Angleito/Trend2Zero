import * as secureMarketDataModule from '../lib/services/secureMarketDataService';
import MongoDbCacheService from '../lib/services/mongoDbCacheService';
import CoinGeckoService from '../lib/services/coinGeckoService';
import CoinMarketCapService from '../lib/services/coinMarketCapService';
import MetalPriceService from '../lib/services/metalPriceService';
import { AssetPrice, MarketAsset } from '../lib/types';

// Explicitly import Jest types
import type { MockedFunction } from 'jest-mock';

// Explicitly import Jest
import { jest } from '@jest/globals';

// Mock entire modules
jest.mock('../lib/services/mongoDbCacheService');
jest.mock('../lib/services/coinGeckoService');
jest.mock('../lib/services/coinMarketCapService');
jest.mock('../lib/services/metalPriceService');
jest.mock('../lib/services/secureMarketDataService');

// Create mock types with explicit method signatures
type MockedCoinGeckoService = {
  getAssetPrice: jest.MockedFunction<(symbol: string) => Promise<AssetPrice | null>>;
  getIdFromSymbol: jest.MockedFunction<(symbol: string) => string | null>;
  getSymbolFromId: jest.MockedFunction<(id: string) => string>;
  getHistoricalData: jest.MockedFunction<(symbol: string, days: number) => Promise<any[]>>;
  baseURL?: string;
  headers?: Record<string, string>;
  symbolToIdMappings?: Record<string, string>;
};

type MockedCoinMarketCapService = {
  getAssetPrice: jest.MockedFunction<(symbol: string) => Promise<AssetPrice | null>>;
  getIdFromSymbol: jest.MockedFunction<(symbol: string) => string | null>;
  getSymbolFromId: jest.MockedFunction<(id: string) => string>;
  baseURL?: string;
  headers?: Record<string, string>;
  symbolToIdMappings?: Record<string, string>;
};

type MockedMetalPriceService = {
  getMetalPrice: jest.MockedFunction<(symbol: string) => Promise<AssetPrice | null>>;
};

describe('Secure Market Data Service Integration', () => {
  let mockService: secureMarketDataModule.SecureMarketDataService;
  let mockMongoDbCacheService: jest.Mocked<MongoDbCacheService>;
  let mockCoinGeckoService: MockedCoinGeckoService;
  let mockCoinMarketCapService: MockedCoinMarketCapService;
  let mockMetalPriceService: MockedMetalPriceService;

  const mockBitcoinAsset: MarketAsset = {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'cryptocurrency',
    id: 'bitcoin'
  };

  const mockBitcoinPrice: AssetPrice = {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'cryptocurrency',
    price: 50000,
    change: 100,
    changePercent: 0.2,
    priceInBTC: 1,
    priceInUSD: 50000,
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Create mocked service instances
    mockMongoDbCacheService = new MongoDbCacheService() as jest.Mocked<MongoDbCacheService>;
    
    // Create mock services with explicit type handling
    mockCoinGeckoService = {
      getAssetPrice: jest.fn(() => Promise.resolve(mockBitcoinPrice)),
      getIdFromSymbol: jest.fn(() => 'bitcoin'),
      getSymbolFromId: jest.fn(() => 'BTC'),
      getHistoricalData: jest.fn(() => Promise.resolve([])),
      baseURL: 'https://api.coingecko.com/api/v3',
      headers: {},
      symbolToIdMappings: {}
    } as MockedCoinGeckoService;

    mockCoinMarketCapService = {
      getAssetPrice: jest.fn(() => Promise.resolve(mockBitcoinPrice)),
      getIdFromSymbol: jest.fn(() => 'bitcoin'),
      getSymbolFromId: jest.fn(() => 'BTC'),
      baseURL: 'https://pro-api.coinmarketcap.com/v1',
      headers: {},
      symbolToIdMappings: {}
    } as MockedCoinMarketCapService;

    mockMetalPriceService = {
      getMetalPrice: jest.fn(() => Promise.resolve(mockBitcoinPrice))
    } as MockedMetalPriceService;

    // Mock the SecureMarketDataService constructor
    const SecureMarketDataServiceMock = secureMarketDataModule.SecureMarketDataService as jest.MockedClass<typeof secureMarketDataModule.SecureMarketDataService>;
    mockService = new SecureMarketDataServiceMock({
      mongoDbCacheService: mockMongoDbCacheService,
      coinGeckoService: mockCoinGeckoService,
      coinMarketCapService: mockCoinMarketCapService,
      metalPriceService: mockMetalPriceService
    } as any);

    // Setup common mock behaviors
    jest.spyOn(mockMongoDbCacheService, 'getCachedAssetList').mockResolvedValue({
      data: {
        data: [mockBitcoinAsset],
        pagination: { total: 1 }
      },
      isCached: true
    });

    jest.spyOn(mockMongoDbCacheService, 'getCachedAssetPrice').mockResolvedValue(null);
    jest.spyOn(mockMongoDbCacheService, 'cacheAssetPrice').mockResolvedValue(undefined);
  });

  describe('Asset Price Fetching', () => {
    it('should fetch price successfully', async () => {
      const result = await mockService.getAssetPrice('BTC');
      
      expect(result).toBeTruthy();
      expect(result?.symbol).toBe('BTC');
      expect(result?.price).toBeGreaterThan(0);
    });

    it('should handle service failure with fallback', async () => {
      // Configure CoinGecko to fail
      mockCoinGeckoService.getAssetPrice.mockRejectedValue(new Error('CoinGecko error'));
      
      // Configure CoinMarketCap to fail
      mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('CoinMarketCap error'));

      const result = await mockService.getAssetPrice('BTC', { fallbackToRandom: true });
      
      expect(result).toBeTruthy();
      expect(result?.symbol).toBe('BTC');
      expect(result?.price).toBeGreaterThan(0);
    });

    it('should return null when no fallback is allowed', async () => {
      // Configure all services to fail
      mockCoinGeckoService.getAssetPrice.mockRejectedValue(new Error('CoinGecko error'));
      mockCoinMarketCapService.getAssetPrice.mockRejectedValue(new Error('CoinMarketCap error'));

      const result = await mockService.getAssetPrice('BTC', { fallbackToRandom: false });
      
      expect(result).toBeNull();
    });
  });

  describe('Timeout Handling', () => {
    it('should respect configured timeout', async () => {
      // Simulate a slow service
      mockCoinGeckoService.getAssetPrice.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockBitcoinPrice), 6000))
      );

      // Use fake timers to control time
      jest.useFakeTimers();
      
      const resultPromise = mockService.getAssetPrice('BTC', { timeout: 5000 });
      
      // Fast-forward timers
      jest.advanceTimersByTime(5000);
      
      const result = await resultPromise;
      
      expect(result).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('Caching Error Handling', () => {
    it('should handle cache write failures gracefully', async () => {
      // Simulate cache write failure
      mockMongoDbCacheService.cacheAssetPrice.mockRejectedValue(new Error('Cache write failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await mockService.getAssetPrice('BTC');
      
      expect(result).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SecureMarketData] Cache error for BTC:'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});