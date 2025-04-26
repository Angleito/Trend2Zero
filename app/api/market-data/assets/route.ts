import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService'; // Import the refactored marketDataService
import { AssetCategory, MarketAsset } from '../../../../lib/types'; // Import types from lib

export async function GET(request: NextRequest) {
  // Safely extract and parse query parameters
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const categoryParam = searchParams.get('category');
  const limitParam = searchParams.get('limit');

  // Normalize and validate parameters
  const type = typeParam ? typeParam.toLowerCase() : null;
  const category = categoryParam ? categoryParam.toLowerCase() : null;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  console.log('Received asset request parameters:', { type, category, limit });

  try {
    // Determine filter category with flexible mapping
    // Using the same mapping logic as before for consistency with query parameters
    const TYPE_CATEGORY_MAP: Record<string, AssetCategory> = {
      'cryptocurrency': 'Cryptocurrency',
      'stocks': 'Stocks',
      'commodities': 'Commodities',
      'indices': 'Indices'
    };

    const filterCategory = category
      ? category
      : (type && TYPE_CATEGORY_MAP[type])
        ? TYPE_CATEGORY_MAP[type]
        : undefined; // Use undefined if no valid category/type

    // Use the refactored marketDataService to get assets
    // marketDataService.listAvailableAssets expects category as AssetCategory type
    const assets = await marketDataService.listAvailableAssets({
      category: filterCategory as AssetCategory | undefined, // Cast to AssetCategory | undefined
      pageSize: limit
    });

    console.log(`Fetched assets (${filterCategory || 'All'}):`, assets.length);

    // Return structured response
    return NextResponse.json(assets); // Return the array of assets

  } catch (error) {
    // Comprehensive error handling
    console.error('Error in asset retrieval:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve assets',
        // Optionally include fallback data if desired, but the service should handle fallbacks
        // fallbackData: []
      },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';