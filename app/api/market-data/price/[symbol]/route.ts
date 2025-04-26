import { NextRequest, NextResponse } from 'next/server';
import { getAssetPrice } from '../../../../../lib/services/marketDataService';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const data = await getAssetPrice(symbol);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Failed to fetch price for ${params.symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';