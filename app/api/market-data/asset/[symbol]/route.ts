import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../../lib/services/marketDataService'; // Adjust import path as needed

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Use the refactored marketDataService to get asset price by symbol
    const asset = await marketDataService.getAssetPrice(symbol);

    if (!asset) {
      return NextResponse.json(
        { error: `Asset not found: ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: asset });
  } catch (error) {
    console.error(`Error fetching asset data for ${symbol}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch asset data` },
      { status: 500 }
    );
  }
}