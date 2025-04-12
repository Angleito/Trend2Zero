import { NextResponse } from 'next/server';
import ExternalApiService from '@/lib/services/externalApiService';
import { AssetData } from '@/lib/types';

type ServiceTestResult = {
  status: string;
  data?: AssetData;
  message?: string;
};

export async function GET() {
  const results: {
    coinmarketcap: ServiceTestResult;
    alphaVantage: ServiceTestResult;
    metalPrice: ServiceTestResult;
    environment: Record<string, string>;
  } = {
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
  };

  try {
    // Test CoinMarketCap API with timeout
    try {
      const cmcService = new ExternalApiService();
      const cmcPromise = cmcService.fetchAssetPrice('BTC');
      const cmcResult = await Promise.race([
        cmcPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as AssetData;
      results.coinmarketcap = {
        status: 'success',
        data: cmcResult
      };
    } catch (error) {
      results.coinmarketcap = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test Alpha Vantage API with timeout
    try {
      const avService = new ExternalApiService();
      const avPromise = avService.fetchAssetPrice('AAPL');
      const avResult = await Promise.race([
        avPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as AssetData;
      results.alphaVantage = {
        status: 'success',
        data: avResult
      };
    } catch (error) {
      results.alphaVantage = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test Metal Price API with timeout
    try {
      const mpService = new ExternalApiService();
      const mpPromise = mpService.fetchAssetPrice('XAU'); // Gold
      const mpResult = await Promise.race([
        mpPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]) as AssetData;
      results.metalPrice = {
        status: 'success',
        data: mpResult
      };
    } catch (error) {
      results.metalPrice = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      error: 'Service test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: results.environment
    }, { status: 500 });
  }
}
