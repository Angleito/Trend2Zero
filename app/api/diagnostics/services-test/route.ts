import { NextResponse } from 'next/server';
import ExternalApiService from '@/lib/services/externalApiService';

interface ServiceResult {
  status: string;
  data?: any;
  message?: string;
  mockData?: boolean;
}

interface DiagnosticResults {
  coinmarketcap: ServiceResult;
  alphaVantage: ServiceResult;
  metalPrice: ServiceResult;
  environment: Record<string, string>;
  error?: string;
  message?: string;
}

export async function GET() {
  const results: DiagnosticResults = {
    coinmarketcap: { status: 'not tested' },
    alphaVantage: { status: 'not tested' },
    metalPrice: { status: 'not tested' },
    environment: {}
  };

  // Check environment variables
  results.environment = {
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY ? 'Set' : 'Not set',
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not set',
    METAL_PRICE_API_KEY: process.env.METAL_PRICE_API_KEY ? 'Set' : 'Not set',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'Not set',
    MOCK_DATA_CACHE_MINUTES: process.env.MOCK_DATA_CACHE_MINUTES || 'Not set'
  };

  try {
    // Test CoinMarketCap API with timeout
    try {
      const cmcService = new ExternalApiService();
      // Use fetchCryptoList instead of fetchCryptoPrices
      const cmcPromise = cmcService.fetchCryptoList(1, 1);
      const cmcResult = await Promise.race([
        cmcPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.coinmarketcap = {
        status: 'success',
        data: cmcResult,
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    } catch (error: unknown) {
      results.coinmarketcap = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    }

    // Test Alpha Vantage API with timeout
    try {
      const avService = new ExternalApiService();
      // Use fetchAssetPrice instead of fetchStockPrice
      const avPromise = avService.fetchAssetPrice('AAPL');
      const avResult = await Promise.race([
        avPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.alphaVantage = {
        status: 'success',
        data: avResult,
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    } catch (error: unknown) {
      results.alphaVantage = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    }

    // Test Metal Price API with timeout
    try {
      const mpService = new ExternalApiService();
      // Use fetchAssetPrice instead of fetchMetalPrice
      const mpPromise = mpService.fetchAssetPrice('XAU'); // Gold
      const mpResult = await Promise.race([
        mpPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.metalPrice = {
        status: 'success',
        data: mpResult,
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    } catch (error: unknown) {
      results.metalPrice = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        mockData: process.env.USE_MOCK_DATA === 'true'
      };
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    return NextResponse.json({
      error: 'Service test failed',
      message: error instanceof Error ? error.message : String(error),
      environment: results.environment
    }, { status: 500 });
  }
}
