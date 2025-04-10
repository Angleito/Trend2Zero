import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Increase timeout for the entire test
test.setTimeout(120000);

test('Comprehensive API Diagnostics', async ({ request }) => {
  // Define the base URL
  const baseUrl = 'http://localhost:3000';

  console.log('Starting comprehensive API diagnostics...');

  // Test the market-data API
  console.log('\nTesting /api/market-data endpoint...');
  const marketDataResponse = await request.get(`${baseUrl}/api/market-data`);
  console.log(`Market data API status: ${marketDataResponse.status()}`);

  if (marketDataResponse.ok()) {
    const marketData = await marketDataResponse.json();
    console.log('Market data API response:', JSON.stringify(marketData).substring(0, 200) + '...');
  } else {
    const text = await marketDataResponse.text();
    console.log('Market data API error:', text.substring(0, 200));
  }

  // Test the bitcoin-price API with timeout
  console.log('\nTesting /api/crypto/bitcoin-price endpoint...');
  try {
    const bitcoinPriceResponse = await request.get(`${baseUrl}/api/crypto/bitcoin-price`, {
      timeout: 10000 // 10 second timeout
    });
    console.log(`Bitcoin price API status: ${bitcoinPriceResponse.status()}`);

    if (bitcoinPriceResponse.ok()) {
      const bitcoinPrice = await bitcoinPriceResponse.json();
      console.log('Bitcoin price API response:', JSON.stringify(bitcoinPrice));
    } else {
      const text = await bitcoinPriceResponse.text();
      console.log('Bitcoin price API error:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('Bitcoin price API request failed with error:', error.message);
  }

  // Create diagnostic API endpoints
  await createDiagnosticEndpoints();

  // Test environment variables with timeout
  console.log('\nTesting environment variables...');
  try {
    const envCheckResponse = await request.get(`${baseUrl}/api/diagnostics/env-check`, {
      timeout: 5000 // 5 second timeout
    });
    console.log(`Environment check API status: ${envCheckResponse.status()}`);

    if (envCheckResponse.ok()) {
      const envData = await envCheckResponse.json();
      console.log('Environment variables:', envData);
    } else {
      console.log('Failed to check environment variables:', await envCheckResponse.text());
    }
  } catch (error) {
    console.log('Environment check request failed with error:', error.message);
  }

  // Test MongoDB connection with timeout
  console.log('\nTesting MongoDB connection...');
  try {
    const mongoTestResponse = await request.get(`${baseUrl}/api/diagnostics/mongo-test`, {
      timeout: 10000 // 10 second timeout
    });
    console.log(`MongoDB test API status: ${mongoTestResponse.status()}`);

    if (mongoTestResponse.ok()) {
      const mongoData = await mongoTestResponse.json();
      console.log('MongoDB connection test:', mongoData);
    } else {
      const text = await mongoTestResponse.text();
      console.log('MongoDB connection test failed:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('MongoDB test request failed with error:', error.message);
  }

  // Test API services with timeout
  console.log('\nTesting API services...');
  try {
    const servicesTestResponse = await request.get(`${baseUrl}/api/diagnostics/services-test`, {
      timeout: 15000 // 15 second timeout
    });
    console.log(`API services test status: ${servicesTestResponse.status()}`);

    if (servicesTestResponse.ok()) {
      const servicesData = await servicesTestResponse.json();
      console.log('API services test:', servicesData);
    } else {
      const text = await servicesTestResponse.text();
      console.log('API services test failed:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('API services test request failed with error:', error.message);
  }
});

async function createDiagnosticEndpoints() {
  const diagnosticsDir = path.join(process.cwd(), 'app/api/diagnostics');
  if (!fs.existsSync(diagnosticsDir)) {
    fs.mkdirSync(diagnosticsDir, { recursive: true });
  }

  // Create environment variables check endpoint
  const envCheckPath = path.join(diagnosticsDir, 'env-check/route.ts');
  const envCheckDir = path.dirname(envCheckPath);
  if (!fs.existsSync(envCheckDir)) {
    fs.mkdirSync(envCheckDir, { recursive: true });
  }

  const envCheckContent = `
import { NextResponse } from 'next/server';

export async function GET() {
  // Check for required environment variables
  const envVars = {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY ? 'Set' : 'Not set',
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not set',
    METAL_PRICE_API_KEY: process.env.METAL_PRICE_API_KEY ? 'Set' : 'Not set',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ? 'Set' : 'Not set',
  };

  return NextResponse.json({
    envVars,
    nodeEnv: process.env.NODE_ENV
  });
}
`;

  fs.writeFileSync(envCheckPath, envCheckContent);
  console.log('Created env-check API endpoint');

  // Create MongoDB test endpoint
  const mongoTestPath = path.join(diagnosticsDir, 'mongo-test/route.ts');
  const mongoTestDir = path.dirname(mongoTestPath);
  if (!fs.existsSync(mongoTestDir)) {
    fs.mkdirSync(mongoTestDir, { recursive: true });
  }

  const mongoTestContent = `
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';

export async function GET() {
  try {
    const conn = await dbConnect();
    return NextResponse.json({
      connected: true,
      dbName: conn.db.databaseName,
      host: conn.host
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
`;

  fs.writeFileSync(mongoTestPath, mongoTestContent);
  console.log('Created mongo-test API endpoint');

  // Create API services test endpoint
  const servicesTestPath = path.join(diagnosticsDir, 'services-test/route.ts');
  const servicesTestDir = path.dirname(servicesTestPath);
  if (!fs.existsSync(servicesTestDir)) {
    fs.mkdirSync(servicesTestDir, { recursive: true });
  }

  const servicesTestContent = `
import { NextResponse } from 'next/server';
import ExternalApiService from '@/lib/services/externalApiService';

export async function GET() {
  const results = {
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
`;

  fs.writeFileSync(servicesTestPath, servicesTestContent);
  console.log('Created services-test API endpoint');
}
