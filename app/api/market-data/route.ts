import { NextRequest, NextResponse } from 'next/server';
import MarketDataService from '@/lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // Create an instance of the MarketDataService
    const marketDataService = new MarketDataService();

    // Get real market data using the service
    const data = await marketDataService.listAvailableAssets({
      category: type as any,
      pageSize: limit
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';
