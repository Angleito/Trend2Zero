import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../../lib/services/marketDataService'; // Adjust import path as needed

export async function GET(request: NextRequest, { params }: { params: { symbol: string } }) {
  const { symbol } = params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    // Use the refactored marketDataService to get asset price by symbol
    const asset = await marketDataService.getAssetPrice(symbol);

    if (!asset) {
      return NextResponse.json({ error: `Asset with symbol ${symbol} not found` }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error(`Failed to fetch asset data for ${symbol}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch asset data for ${symbol}` },
      { status: 500 }
    );
  }
}