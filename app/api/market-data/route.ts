import { NextRequest, NextResponse } from 'next/server';
import { getPopularAssets } from '../../../lib/services/marketDataService';
import { MarketDataOptions, parseAssetCategory } from '../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options: Partial<MarketDataOptions> = {
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    };

    const category = searchParams.get('category');
    if (category) {
      const parsedCategory = parseAssetCategory(category);
      if (parsedCategory) {
        options.category = parsedCategory;
      }
    }

    // Fetch market data using getPopularAssets
    const marketData = await getPopularAssets(options);

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

// Make this route dynamic to allow real-time market data updates
export const dynamic = 'force-dynamic';
