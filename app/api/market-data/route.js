import { NextResponse } from 'next/server';
import { parseAssetCategory } from '@/lib/types';
import marketDataService from '@/lib/services/marketDataService';
export async function GET(request) {
    const marketService = marketDataService;
    try {
        // Parse query parameters for market data options
        const { searchParams } = new URL(request.url);
        // Extract and validate market data options
        const options = {
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : undefined,
            category: searchParams.get('category')
                ? parseAssetCategory(searchParams.get('category'))
                : undefined,
            sortBy: searchParams.get('sortBy'),
            sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
            searchQuery: searchParams.get('searchQuery') || undefined
        };
        // Fetch market data using the parsed options
        const marketData = await marketDataService.listAvailableAssets(options);
        // Return the market data as JSON response
        return NextResponse.json(marketData);
    }
    catch (error) {
        console.error('[API] Market data retrieval error:', error);
        // Construct a type-safe error response
        const errorResponse = {
            error: error instanceof Error ? error.message : 'Failed to retrieve market data',
            status: 500,
            details: {
                timestamp: new Date().toISOString(),
                requestOptions: {
                    limit: request.url.includes('limit'),
                    category: request.url.includes('category'),
                    sortBy: request.url.includes('sortBy'),
                    searchQuery: request.url.includes('searchQuery')
                }
            }
        };
        return new NextResponse(JSON.stringify(errorResponse), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
// Make this route dynamic to allow real-time market data updates
export const dynamic = 'force-dynamic';
