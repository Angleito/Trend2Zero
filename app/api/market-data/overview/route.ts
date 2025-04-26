import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService'; // Import the refactored marketDataService

export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] Fetching market overview');
    const overview = await marketDataService.getMarketOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('[API Route] Failed to fetch market overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview' },
      { status: 500 }
    );
  }
}

export const dynamic = 'auto';