import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { z } from 'zod';

// Validation schema for CoinMarketCap API requests
const requestSchema = z.object({
  endpoint: z.string(),
  params: z.record(z.string(), z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    // Log environment variables for debugging (don't include in production)
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_CMC_KEY: !!apiKey,
      KEY_LENGTH: apiKey ? apiKey.length : 0
    });

    if (!apiKey) {
      console.warn('CoinMarketCap API key is missing. Using mock data.');
      return NextResponse.json({
        price: 50000,
        last_updated: new Date().toISOString(),
        raw_data: {
          symbol: 'BTC',
          market_cap: 1000000000000,
          percent_change_24h: 2.5
        }
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || '';

    // Validate request parameters
    const validation = requestSchema.safeParse({
      endpoint,
      params: Object.fromEntries(searchParams.entries())
    });

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request parameters'
      }, { status: 400 });
    }

    // Special handling for Bitcoin price
    if (endpoint === 'bitcoin-price') {
      const apiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
      const requestParams = {
        'symbol': 'BTC',
        'convert': 'USD',
        'CMC_PRO_API_KEY': apiKey
      };

      try {
        const response = await axios.get(apiUrl, { params: requestParams });

        // Log full response for debugging
        console.log('Full CoinMarketCap Response:', JSON.stringify(response.data, null, 2));

        // More robust extraction of Bitcoin price data
        const bitcoinData = response.data?.data?.BTC?.quote?.USD;
        if (!bitcoinData) {
          console.error('Unexpected response structure:', response.data);
          return NextResponse.json({
            error: 'Unable to extract Bitcoin price data',
            rawResponse: response.data
          }, { status: 404 });
        }

        return NextResponse.json({
          price: bitcoinData.price,
          last_updated: bitcoinData.last_updated,
          raw_data: {
            symbol: 'BTC',
            market_cap: response.data.data.BTC.quote.USD.market_cap,
            percent_change_24h: response.data.data.BTC.quote.USD.percent_change_24h
          }
        });
      } catch (error: any) {
        console.error('Detailed CoinMarketCap Bitcoin Price API error:', error.response?.data || error.message);

        const status = error.response?.status || 500;
        const message = error.response?.data?.status?.error_message || 'Failed to fetch Bitcoin price';

        return NextResponse.json({ error: message }, { status });
      }
    } else {
      const apiUrl = `https://pro-api.coinmarketcap.com/v1/${endpoint}`;
      const requestParams = {
        ...validation.data.params,
        'CMC_PRO_API_KEY': apiKey
      };

      try {
        const response = await axios.get(apiUrl, { params: requestParams });
        return NextResponse.json(response.data);
      } catch (error: any) {
        console.error('CoinMarketCap API error:', error.message);

        const status = error.response?.status || 500;
        const message = error.response?.data?.error || 'An error occurred while fetching market data';

        return NextResponse.json({ error: message }, { status });
      }
    }
  } catch (error) {
    console.error('Unexpected error in crypto route:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
