import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const assets = await marketDataService.searchAssets(query, limit);
    return NextResponse.json(assets);
  } catch (error) {
    console.error('[API] Error searching assets:', error);
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';