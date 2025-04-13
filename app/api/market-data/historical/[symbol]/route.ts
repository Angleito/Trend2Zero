import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get current price first
    const currentResponse = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
      {
        params: { symbol, convert: 'USD' },
        headers: { 'X-CMC_PRO_API_KEY': apiKey }
      }
    );

    const currentPrice = currentResponse.data.data[symbol].quote.USD.price;

    // Get historical data
    const historicalResponse = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical`,
      {
        params: {
          symbol,
          time_start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          time_end: new Date().toISOString(),
          interval: '1d'
        },
        headers: { 'X-CMC_PRO_API_KEY': apiKey }
      }
    );

    const historicalData = historicalResponse.data.data[symbol].quotes.map((quote: any) => ({
      date: new Date(quote.timestamp),
      price: quote.quote.USD.price,
      open: quote.quote.USD.open,
      high: quote.quote.USD.high,
      low: quote.quote.USD.low,
      close: quote.quote.USD.close,
      volume: quote.quote.USD.volume
    }));

    // Add current price point
    historicalData.push({
      date: new Date(),
      price: currentPrice,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: currentResponse.data.data[symbol].quote.USD.volume_24h
    });

    return NextResponse.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';