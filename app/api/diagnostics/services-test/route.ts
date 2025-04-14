import { NextResponse } from 'next/server';
import axios from 'axios';

// Add proper TypeScript interfaces for result objects
interface ServiceResult {
  status: string;
  data?: any;
  message?: string;
}

interface TestResults {
  coinmarketcap: ServiceResult;
  alphaVantage: ServiceResult;
  metalPrice: ServiceResult;
  environment: {
    [key: string]: string;
  };
}

// Inline simplified ExternalApiService to avoid import issues
class ExternalApiService {
  async fetchCryptoPrices(symbols = ['BTC']) {
    try {
      if (!process.env.COINMARKETCAP_API_KEY) {
        return { error: 'API key not configured' };
      }
      
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
        },
        params: {
          symbol: symbols.join(',')
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return { error: error.message || 'Unknown error' };
    }
  }
  
  async fetchStockPrice(symbol = 'AAPL') {
    try {
      if (!process.env.ALPHA_VANTAGE_API_KEY) {
        return { error: 'API key not configured' };
      }
      
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      return { error: error.message || 'Unknown error' };
    }
  }
  
  async fetchMetalPrice(symbol = 'XAU') {
    try {
      if (!process.env.METAL_PRICE_API_KEY) {
        return { error: 'API key not configured' };
      }
      
      const response = await axios.get(`https://api.metalpriceapi.com/v1/latest`, {
        params: {
          api_key: process.env.METAL_PRICE_API_KEY,
          base: 'USD',
          currencies: symbol
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching metal price:', error);
      return { error: error.message || 'Unknown error' };
    }
  }
}

export async function GET() {
  // Initialize results with proper typing
  const results: TestResults = {
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
      const cmcPromise = cmcService.fetchCryptoPrices(['BTC']);
      const cmcResult = await Promise.race([
        cmcPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.coinmarketcap = {
        status: 'success',
        data: cmcResult
      };
    } catch (error) {
      results.coinmarketcap = {
        status: 'error',
        message: error.message
      };
    }

    // Test Alpha Vantage API with timeout
    try {
      const avService = new ExternalApiService();
      const avPromise = avService.fetchStockPrice('AAPL');
      const avResult = await Promise.race([
        avPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.alphaVantage = {
        status: 'success',
        data: avResult
      };
    } catch (error) {
      results.alphaVantage = {
        status: 'error',
        message: error.message
      };
    }

    // Test Metal Price API with timeout
    try {
      const mpService = new ExternalApiService();
      const mpPromise = mpService.fetchMetalPrice('XAU'); // Gold
      const mpResult = await Promise.race([
        mpPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      results.metalPrice = {
        status: 'success',
        data: mpResult
      };
    } catch (error) {
      results.metalPrice = {
        status: 'error',
        message: error.message
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      error: 'Service test failed',
      message: error.message,
      environment: results.environment
    }, { status: 500 });
  }
}
