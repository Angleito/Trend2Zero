import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { AssetCategory, MarketAsset } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as AssetCategory;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
      {
        params: {
          limit: limit,
          convert: 'USD'
        },
        headers: { 'X-CMC_PRO_API_KEY': apiKey }
      }
    );

    const assets: MarketAsset[] = response.data.data.map((asset: any) => ({
      symbol: asset.symbol,
      name: asset.name,
      type: 'Cryptocurrency',
      description: asset.description || `${asset.name} cryptocurrency`,
      priceInUSD: asset.quote.USD.price,
      priceInBTC: asset.quote.USD.price / response.data.data[0].quote.USD.price, // Using first asset (BTC) as reference
      change24h: asset.quote.USD.percent_change_24h,
      lastUpdated: asset.quote.USD.last_updated
    }));

    // Filter by category if specified
    const filteredAssets = category
      ? assets.filter((asset: MarketAsset) => asset.type === category)
      : assets;

    return NextResponse.json(filteredAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';