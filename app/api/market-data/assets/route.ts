import { NextRequest, NextResponse } from 'next/server';
import ExternalApiService from '@/lib/services/externalApiService';
import { AssetCategory, MarketAsset } from '@/lib/types';

// Enhanced mapping between type and category
const TYPE_CATEGORY_MAP: Record<string, AssetCategory> = {
  'Cryptocurrency': 'Cryptocurrency',
  'Stocks': 'Stocks',
  'Commodities': 'Commodities',
  'Indices': 'Indices',
  'crypto': 'Cryptocurrency',
  'stock': 'Stocks',
  'commodity': 'Commodities',
  'index': 'Indices'
};

export async function GET(request: NextRequest) {
  // Safely extract and parse query parameters
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const categoryParam = searchParams.get('category');
  const limitParam = searchParams.get('limit');

  // Normalize and validate parameters
  const type = typeParam ? typeParam.toLowerCase() : null;
  const category = categoryParam ? categoryParam.toLowerCase() : null;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  console.log('Received asset request parameters:', { type, category, limit });

  try {
    // Initialize external API service
    const externalApiService = new ExternalApiService();

    // Fetch crypto list
    const response = await externalApiService.fetchCryptoList(1, limit);
    
    // Safely map assets with comprehensive type checking
    const assets: MarketAsset[] = response.data.map((asset: any) => ({
      symbol: asset.symbol || '',
      name: asset.name || 'Unknown',
      type: 'Cryptocurrency',
      description: asset.description || `${asset.name || 'Asset'} cryptocurrency`,
      priceInUSD: 0,
      priceInBTC: 0,
      change24h: 0,
      lastUpdated: new Date().toISOString()
    }));

    // Determine filter category with flexible mapping
    const filterCategory = category 
      ? category 
      : (type && TYPE_CATEGORY_MAP[type]) 
        ? TYPE_CATEGORY_MAP[type] 
        : null;

    // Filter assets by category if specified
    const filteredAssets = filterCategory
      ? assets.filter((asset) => 
          asset.type && asset.type.toLowerCase() === filterCategory
        )
      : assets;

    console.log(`Filtered assets (${filterCategory || 'All'}):`, filteredAssets.length);

    // Return structured response
    return NextResponse.json({
      assets: filteredAssets,
      total: filteredAssets.length,
      filterApplied: !!filterCategory
    });

  } catch (error) {
    // Comprehensive error handling
    console.error('Error in asset retrieval:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve assets',
        fallbackData: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'Cryptocurrency',
            priceInUSD: 50000,
            priceInBTC: 1,
            change24h: 2.5,
            lastUpdated: new Date().toISOString()
          }
        ]
      },
      { status: 500 }
    );
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';