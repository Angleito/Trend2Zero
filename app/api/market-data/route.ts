import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define AssetCategory type locally instead of importing it
type AssetCategory = 'Stocks' | 'Commodities' | 'Indices' | 'Cryptocurrency';

// Fallback assets for when API calls fail
const FALLBACK_ASSETS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'Cryptocurrency',
    description: 'Bitcoin is a decentralized digital currency.',
    priceInUSD: 65000,
    priceInBTC: 1,
    change24h: 2.5,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'Cryptocurrency',
    description: 'Ethereum is a decentralized computing platform.',
    priceInUSD: 3500,
    priceInBTC: 0.054,
    change24h: 3.2,
    lastUpdated: new Date().toISOString()
  }
];

// Inline implementation of getAssetsByType
async function getAssetsByType(category = 'all', limit = 10) {
  try {
    // Use CoinGecko API to get cryptocurrency data
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1
        }
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      // Map CoinGecko response to our format
      const assets = response.data.map(coin => ({
        symbol: coin.symbol?.toUpperCase() || '',
        name: coin.name || '',
        type: 'Cryptocurrency',
        description: `${coin.name} cryptocurrency`,
        priceInUSD: coin.current_price || 0,
        priceInBTC: coin.symbol === 'btc' ? 1 : (coin.current_price / (response.data.find(c => c.symbol === 'btc')?.current_price || 1)),
        change24h: coin.price_change_percentage_24h || 0,
        lastUpdated: new Date().toISOString()
      }));
      
      return assets;
    }
    
    // Return fallback if API fails
    return FALLBACK_ASSETS;
  } catch (error) {
    console.error('Error fetching assets by type:', error);
    return FALLBACK_ASSETS;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // Validate limit
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    // Validate category if provided
    const validCategories: AssetCategory[] = ['Stocks', 'Commodities', 'Indices', 'Cryptocurrency'];
    const category = type && validCategories.includes(type as AssetCategory)
      ? type as AssetCategory
      : undefined;

    // Detailed logging for debugging
    console.log('Market Data Request:', { category, limit });

    // Get market data using our inline function
    const data = await getAssetsByType(category as string || 'all', limit);

    // Log response details
    console.log(`Fetched ${data.length} market assets`);

    return NextResponse.json(data);
  } catch (error) {
    // Comprehensive error logging
    console.error('Detailed Market Data Fetch Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error
    });

    return NextResponse.json({
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';
