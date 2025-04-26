import { NextRequest, NextResponse } from 'next/server';
import { searchAssets } from '../../../../lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const results = await searchAssets(query, limit);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500 }
    );
  }
}