import { NextResponse } from 'next/server';

interface ServiceResult {
  status: string;
  data?: any;
  message?: string;
}

interface DiagnosticsResult {
  coinmarketcap: ServiceResult;
  alphaVantage: ServiceResult;
  metalPrice: ServiceResult;
  environment: {
    COINMARKETCAP_API_KEY: string;
    ALPHA_VANTAGE_API_KEY: string;
    METAL_PRICE_API_KEY: string;
  };
}

export async function GET() {
  const results: DiagnosticsResult = {
    coinmarketcap: { status: 'not available in production' },
    alphaVantage: { status: 'not available in production' },
    metalPrice: { status: 'not available in production' },
    environment: {
      COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY ? 'Set' : 'Not set',
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not set',
      METAL_PRICE_API_KEY: process.env.METAL_PRICE_API_KEY ? 'Set' : 'Not set',
    }
  };

  return NextResponse.json(results);
}
