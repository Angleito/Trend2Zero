import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  // Validate endpoint
  if (endpoint !== 'bitcoin-price') {
    return NextResponse.json({
      error: 'Invalid or missing endpoint. Use "bitcoin-price".'
    }, { status: 400 });
  }

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

    // Fetch real-time data from CoinMarketCap
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: { symbol: 'BTC', convert: 'USD' },
      headers: { 'X-CMC_PRO_API_KEY': apiKey }
    });

    const btcData = response.data.data.BTC.quote.USD;

    const processedData = {
      price: btcData.price,
      last_updated: btcData.last_updated,
      raw_data: {
        symbol: 'BTC',
        market_cap: btcData.market_cap,
        percent_change_24h: btcData.percent_change_24h
      }
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return NextResponse.json(FALLBACK_CRYPTO_DATA);
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';
