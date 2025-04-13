import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
      {
        params: { symbol, convert: 'USD' },
        headers: { 'X-CMC_PRO_API_KEY': apiKey }
      }
    );

    const data = response.data.data[symbol].quote.USD;

    return NextResponse.json({
      symbol,
      price: data.price,
      change: data.volume_change_24h,
      changePercent: data.percent_change_24h,
      priceInBTC: data.price / response.data.data['BTC'].quote.USD.price,
      priceInUSD: data.price,
      lastUpdated: data.last_updated
    });
  } catch (error) {
    console.error('Error fetching price data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';