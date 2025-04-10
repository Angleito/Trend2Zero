
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
