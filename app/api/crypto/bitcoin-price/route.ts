import { NextResponse } from 'next/server';

// Fallback Bitcoin price data for static generation
const FALLBACK_BITCOIN_PRICE = {
  symbol: 'BTC',
  price: 67890.12,
  change: 1234.56,
  changePercent: 2.34,
  priceInBTC: 1.0,
  priceInUSD: 67890.12,
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  try {
    // Return fallback data for Vercel deployment
    return NextResponse.json(FALLBACK_BITCOIN_PRICE);
  } catch (error) {
    console.error('Error in Bitcoin price endpoint:', error);
    return NextResponse.json(FALLBACK_BITCOIN_PRICE);
  }
}

// Make this route dynamic to allow API calls
export const dynamic = 'force-dynamic';
