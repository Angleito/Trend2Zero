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
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'CoinMarketCap API key is not configured' 
      }, { status: 500 });
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
  } catch (error) {
    console.error('Unexpected error in crypto route:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
