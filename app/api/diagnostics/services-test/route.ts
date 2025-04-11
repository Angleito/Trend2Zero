
import { NextResponse } from 'next/server';
import ExternalApiService from '../../../../lib/services/externalApiService';

export async function GET() {
  // Define the type for the results object
  type ServiceResult = {
    status: string;
    data?: any;
    message?: string;
  };

  const results: {
    coinmarketcap: ServiceResult;
    alphaVantage: ServiceResult;
    metalPrice: ServiceResult;
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
      // Use fetchAssetPrice instead of fetchCryptoPrices which doesn't exist
      const cmcPromise = cmcService.fetchAssetPrice('BTC');
      const cmcResult = await Promise.race([
        cmcPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.coinmarketcap = {
        status: 'success',
        data: cmcResult
      };
    } catch (error: any) { // Type assertion for error
      results.coinmarketcap = {
        status: 'error',
        message: error?.message || 'Unknown error'
      };
    }

    // Test Alpha Vantage API with timeout
    try {
      const avService = new ExternalApiService();
      // Use fetchAssetPrice instead of fetchStockPrice which is private
      const avPromise = avService.fetchAssetPrice('AAPL');
      const avResult = await Promise.race([
        avPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.alphaVantage = {
        status: 'success',
        data: avResult
      };
    } catch (error: any) { // Type assertion for error
      results.alphaVantage = {
        status: 'error',
        message: error?.message || 'Unknown error'
      };
    }

    // Test Metal Price API with timeout
    try {
      const mpService = new ExternalApiService();
      // Use fetchAssetPrice instead of fetchMetalPrice which doesn't exist
      const mpPromise = mpService.fetchAssetPrice('XAU'); // Gold
      const mpResult = await Promise.race([
        mpPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.metalPrice = {
        status: 'success',
        data: mpResult
      };
    } catch (error: any) { // Type assertion for error
      results.metalPrice = {
        status: 'error',
        message: error?.message || 'Unknown error'
      };
    }

    return NextResponse.json(results);
  } catch (error: any) { // Type assertion for error
    return NextResponse.json({
      error: 'Service test failed',
      message: error?.message || 'Unknown error',
      environment: results.environment
    }, { status: 500 });
  }
}
