import axios, { AxiosError } from 'axios';
import MockDataService from './mockDataService';
import { AssetCategory, AssetData, HistoricalDataPoint, MarketAsset } from '../types';

/**
 * External API Service
 *
 * This service handles all external API calls to fetch market data
 * from various sources like CoinMarketCap, Alpha Vantage, and MetalPriceAPI.
 */
export class ExternalApiService {
  private coinMarketCapApiKey: string;
  private alphaVantageApiKey: string;
  private metalPriceApiKey: string;
  private mockDataService: MockDataService;
  private useMockData: boolean;
  private mockDataCacheMinutes: number;
  
  // Rate limiting properties
  private lastApiCallTimestamp: number = 0;
  private readonly API_RATE_LIMIT_MS = 1000; // 1 second between calls

  constructor() {
    this.coinMarketCapApiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.metalPriceApiKey = process.env.METAL_PRICE_API_KEY || '';
    this.mockDataService = new MockDataService();
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
    this.mockDataCacheMinutes = parseInt(process.env.MOCK_DATA_CACHE_MINUTES || '60', 10);
  }

  /**
   * Apply rate limiting to API calls
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTimestamp;

    if (timeSinceLastCall < this.API_RATE_LIMIT_MS) {
      const waitTime = this.API_RATE_LIMIT_MS - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastApiCallTimestamp = Date.now();
  }

  /**
   * Fetch cryptocurrency data from CoinMarketCap
   */
  async fetchCryptoList(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      // Apply rate limiting
      await this.applyRateLimit();

      // If mock data is enabled, return mock data immediately
      if (this.useMockData) {
        console.log('Using mock data for crypto list');
        return this.mockDataService.getMockCryptoList(page, pageSize);
      }

      if (!this.coinMarketCapApiKey) {
        throw new Error('CoinMarketCap API key is missing');
      }

      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': this.coinMarketCapApiKey
        },
        params: {
          start: (page - 1) * pageSize + 1,
          limit: pageSize,
          convert: 'USD'
        }
      });

      // Transform the response to match our expected format
      const assets = response.data.data.map((crypto: any) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        type: 'Cryptocurrency',
        description: crypto.slug
      }));

      return {
        data: assets,
        pagination: {
          page,
          pageSize,
          totalItems: response.data.status.total_count,
          totalPages: Math.ceil(response.data.status.total_count / pageSize)
        }
      };
    } catch (error) {
      // Enhanced error logging for CoinMarketCap API errors
      if (axios.isAxiosError(error)) {
        const apiError = error;
        console.error('CoinMarketCap API Error:', {
          status: apiError.response?.status,
          message: apiError.message,
          data: apiError.response?.data
        });

        // Specific error handling
        switch (apiError.response?.status) {
          case 401:
            console.error('Unauthorized: Check your CoinMarketCap API key');
            break;
          case 429:
            console.error('Rate limit exceeded: Slow down requests');
            break;
          case 403:
            console.error('Forbidden: API key may have restrictions');
            break;
        }
      } else {
        console.error('Unexpected error fetching crypto list:', error);
      }

      // If mock data is enabled, fall back
      if (this.useMockData) {
        console.log('Falling back to mock data for crypto list');
        return this.mockDataService.getMockCryptoList(page, pageSize);
      }

      throw error;
    }
  }

  // ... rest of the existing methods remain unchanged
}

export default ExternalApiService;
