import { NextResponse } from 'next/server';

// Fallback data for static generation
const FALLBACK_CRYPTO_DATA = {
  price: 50000,
  last_updated: new Date().toISOString(),
  raw_data: {
    symbol: 'BTC',
    market_cap: 1000000000000,
    percent_change_24h: 2.5
  }
};

export async function GET() {
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    // Return fallback data for static generation
    return NextResponse.json(FALLBACK_CRYPTO_DATA);
  }

  // For development, attempt to fetch real data if API key is available
  try {
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey) {
      console.warn('CoinMarketCap API key is missing. Using fallback data.');
      return NextResponse.json(FALLBACK_CRYPTO_DATA);
    }

    // Placeholder for actual API call logic
    // This would be replaced with a real implementation
    return NextResponse.json(FALLBACK_CRYPTO_DATA);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(FALLBACK_CRYPTO_DATA);
  }
}

// Enable static generation
export const dynamic = 'force-static';
