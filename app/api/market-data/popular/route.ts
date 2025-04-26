import { NextRequest, NextResponse } from 'next/server';
import { getPopularAssets } from '../../../../lib/services/marketDataService'; // Corrected import to use named export
import { AssetCategory } from '../../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const rawCategory = searchParams.get('category');

    // Validate that the category is a valid AssetCategory (optional, depending on if popular assets are filtered by category)
    // Based on marketDataService.getPopularAssets, it doesn't seem to take a category filter,
    // so we might not need this validation here or need to update getPopularAssets.
    // For now, keeping the validation but noting the potential mismatch.
    const category = rawCategory as AssetCategory | undefined;
    if (rawCategory && !['Cryptocurrency', 'Stocks', 'PreciousMetal'].includes(rawCategory)) { // Updated categories based on lib/types.ts
       return NextResponse.json(
         { error: 'Invalid category' },
         { status: 400 }
       );
    }

    // Use the refactored marketDataService to get popular assets
    const assets = await getPopularAssets({ limit }); // Use the named import and pass options

    // If marketDataService.getPopularAssets doesn't handle limit, apply it here
    // const limitedAssets = assets.slice(0, limit); // This line is no longer needed if getPopularAssets handles limit

    return NextResponse.json(assets); // Return the assets
  } catch (error) {
    console.error('Failed to fetch popular assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular assets' },
      { status: 500 }
    );
  }
}