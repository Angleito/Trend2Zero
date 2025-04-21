import { NextResponse } from 'next/server';
import axios from 'axios';
import { AssetPrice, ErrorResponse } from '@/lib/types';

// Fallback Bitcoin price data for static generation
const FALLBACK_BITCOIN_PRICE: AssetPrice = {
  symbol: 'BTC',
  name: 'Bitcoin',
  type: 'Cryptocurrency',
  price: 67890.12,
  change: 1234.56,
  changePercent: 1.85,
  priceInBTC: 1,
  priceInUSD: 67890.12,
  lastUpdated: '2025-04-15T00:00:00Z',
};

// Inline implementation of getAssetPrice with explicit typing
async function getAssetPrice(symbol: string): Promise<AssetPrice> {
  try {
    // First try to call our own API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    if (apiUrl) {
      const response = await axios.get(`${apiUrl}/market-data/price/${symbol}`);
      return response.data as AssetPrice;
    }
    
    // If no API URL, fall back to CoinGecko directly
    const cgResponse = await axios.get<{
      bitcoin?: {
        usd: number;
        usd_24h_change?: number;
      }
    }>(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (cgResponse.data && cgResponse.data.bitcoin) {
      return {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'Cryptocurrency',
        price: cgResponse.data.bitcoin.usd,
        change: cgResponse.data.bitcoin.usd_24h_change || 0,
        changePercent: cgResponse.data.bitcoin.usd_24h_change || 0,
        priceInUSD: cgResponse.data.bitcoin.usd,
        priceInBTC: 1.0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Return fallback as last resort
    return FALLBACK_BITCOIN_PRICE;
  } catch (error) {
    console.error('Error fetching asset price:', error);
    return FALLBACK_BITCOIN_PRICE;
  }
}

export async function GET() {
  try {
    console.log('[API] /api/crypto/bitcoin-price called');
    const btcData = await getAssetPrice('BTC');
    console.log('[API] getAssetPrice returned:', btcData);

    if (btcData) {
      return NextResponse.json(btcData);
    } else {
      // All providers failed, return 503 with clear error message
      console.warn('[API] Bitcoin price service failed, no data available.');
      return new NextResponse(
        JSON.stringify({
          error: 'All providers are rate-limited or unavailable. No Bitcoin price data available.',
          status: 503,
          ...FALLBACK_BITCOIN_PRICE
        } as ErrorResponse),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[API] Error in Bitcoin price endpoint:', error);
    return new NextResponse(
      JSON.stringify({
        ...FALLBACK_BITCOIN_PRICE,
        error: error instanceof Error ? error.message : String(error),
        status: 503
      } as ErrorResponse),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Make this route dynamic to allow API calls
export const dynamic = 'force-dynamic';
