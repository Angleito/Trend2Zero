import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData } from '../../../../../lib/services/marketDataService';
import type { HistoricalDataPoint } from '../../../../../lib/types';

type SymbolParam = string;

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: SymbolParam } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const historicalData = await getHistoricalData(symbol, days);
    
    return NextResponse.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'auto';