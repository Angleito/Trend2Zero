import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const assets = await marketDataService.getPopularAssets();
    return NextResponse.json(assets.slice(0, limit));
  } catch (error) {
    console.error('[API] Error fetching popular assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular assets' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';