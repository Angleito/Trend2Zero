import { NextResponse } from 'next/server';
import { getAssetPrice } from '@/lib/api/marketDataService';

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
    console.log('[API] /api/crypto/bitcoin-price called');
    const btcData = await getAssetPrice('BTC');
    console.log('[API] MarketDataService.getAssetPrice returned:', btcData);

    if (btcData) {
      return NextResponse.json(btcData);
    } else {
      // All providers failed, return 503 with clear error message
      console.warn('[API] Bitcoin price service failed, no data available.');
      return new NextResponse(
        JSON.stringify({
          error: 'All providers are rate-limited or unavailable. No Bitcoin price data available.',
          ...FALLBACK_BITCOIN_PRICE
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[API] Error in Bitcoin price endpoint:', error);
    return new NextResponse(
      JSON.stringify({
        ...FALLBACK_BITCOIN_PRICE,
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Make this route dynamic to allow API calls
export const dynamic = 'force-dynamic';
