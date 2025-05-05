import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService';
import { AssetCategory } from '../../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!type) {
      return NextResponse.json(
        { error: 'Asset type is required' },
        { status: 400 }
      );
    }

    // Validate asset type
    if (!['Cryptocurrency', 'Stocks', 'PreciousMetal'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid asset type' },
        { status: 400 }
      );
    }

    // Search for assets of the specified type
    const assets = await marketDataService.searchAssets(type, limit);
    
    // Filter by type since searchAssets might return mixed types
    const filteredAssets = assets.filter(asset => asset.type === type);
    
    return NextResponse.json(filteredAssets);
  } catch (error) {
    console.error('[API] Error fetching assets by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';