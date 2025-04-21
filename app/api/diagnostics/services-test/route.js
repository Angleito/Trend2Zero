import { NextResponse } from 'next/server';
import { ExternalApiService } from '../../../../lib/services/externalApiService';
export async function GET() {
    const cmcService = new ExternalApiService();
    const avService = new ExternalApiService();
    const mpService = new ExternalApiService();
    try {
        const cmcPromise = cmcService.fetchCryptoPrices(['BTC']);
        const avPromise = avService.fetchStockPrice('AAPL');
        const mpPromise = mpService.fetchMetalPrice('XAU'); // Gold
        const [cmcResult, avResult, mpResult] = await Promise.all([
            cmcPromise,
            avPromise,
            mpPromise
        ]);
        return NextResponse.json({
            cryptocurrency: cmcResult,
            stock: avResult,
            metal: mpResult
        });
    }
    catch (error) {
        console.error('Diagnostics service test error:', error);
        return NextResponse.json({
            error: 'Failed to fetch diagnostic data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
