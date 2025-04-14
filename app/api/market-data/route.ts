import { NextRequest, NextResponse } from 'next/server';
import { getAssetsByType } from '@/lib/api/marketDataService';
import { AssetCategory } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // Validate limit
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    // Validate category if provided
    const validCategories: AssetCategory[] = ['Stocks', 'Commodities', 'Indices', 'Cryptocurrency'];
    const category = type && validCategories.includes(type as AssetCategory)
      ? type as AssetCategory
      : undefined;

    // Detailed logging for debugging
    console.log('Market Data Request:', { category, limit });

    // Get real market data using the service
    const response = await getAssetsByType(category || 'all', limit);
    const data = response.assets || [];

    // Log response details
    console.log(`Fetched ${data.length} market assets`);

    return NextResponse.json(data);
  } catch (error) {
    // More comprehensive error logging
    console.error('Detailed Market Data Fetch Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });

    return NextResponse.json({
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';
