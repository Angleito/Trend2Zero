import { NextResponse } from 'next/server';
import ExternalApiService from '@/lib/services/externalApiService';
import MongoDbCacheService from '@/lib/services/mongoDbCacheService';

// Fallback Bitcoin price data for static generation
const FALLBACK_BITCOIN_PRICE = {
  symbol: 'BTC',
  price: 67890.12,
  change: 1234.56,
  changePercent: 2.34,
  priceInBTC: 1.0,
  priceInUSD: 67890.12,
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  // Initialize services
  const externalApiService = new ExternalApiService();
  const mongoDbCacheService = new MongoDbCacheService();

  try {
    // Try to get data from MongoDB cache first
    const cachedData = await mongoDbCacheService.getCachedAssetPrice('BTC');
    if (cachedData) {
      console.log('Using cached Bitcoin price from MongoDB');
      return NextResponse.json(cachedData);
    }

    // If not in cache, fetch from external API
    try {
      console.log('Fetching Bitcoin price from external API');
      const bitcoinData = await externalApiService.fetchAssetPrice('BTC');

      // Cache the result in MongoDB
      await mongoDbCacheService.cacheAssetPrice('BTC', bitcoinData);

      return NextResponse.json(bitcoinData);
    } catch (apiError) {
      console.error('Error fetching Bitcoin price from API:', apiError);

      // If API call fails, return fallback data
      return NextResponse.json(FALLBACK_BITCOIN_PRICE);
    }
  } catch (error) {
    console.error('Error in Bitcoin price endpoint:', error);
    return NextResponse.json(FALLBACK_BITCOIN_PRICE);
  }
}

// Make this route dynamic to allow API calls
export const dynamic = 'force-dynamic';
