import { NextRequest, NextResponse } from 'next/server';
import { getPopularAssets } from '../../../lib/services/marketDataService';
import { MarketDataOptions, parseAssetCategory } from '../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options: Partial<MarketDataOptions> = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      category: searchParams.get('category') ? parseAssetCategory(searchParams.get('category')!) : undefined,
    };

    // Fetch market data using getPopularAssets
    let marketData = await getPopularAssets();
    
    // Apply filtering based on options
    if (options.category) {
      marketData = marketData.filter(asset => asset.type === options.category);
    }
    
    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      marketData = marketData.slice(0, options.limit);
    }

    // Return the market data as JSON response
    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' });
  }
}

// Make this route dynamic to allow real-time market data updates
export const dynamic = 'force-dynamic';
