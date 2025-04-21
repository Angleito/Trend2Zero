import { NextResponse } from 'next/server';
import axios from 'axios';
export async function GET(request) {
    try {
        // Extract symbol from the URL path using regex
        const match = request.nextUrl.pathname.match(/\/price\/([^/]+)/);
        const symbol = match ? match[1] : null;
        if (!symbol) {
            return NextResponse.json({ error: 'Symbol parameter is missing in the URL' }, { status: 400 });
        }
        const apiKey = process.env.COINMARKETCAP_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
            params: { symbol, convert: 'USD' },
            headers: { 'X-CMC_PRO_API_KEY': apiKey }
        });
        // Enhanced validation
        const symbolData = response.data?.data?.[symbol];
        const quoteData = symbolData?.quote?.USD;
        if (!symbolData || !quoteData) {
            console.error('Invalid API response structure', response.data);
            return NextResponse.json({ error: 'Unable to parse price data', details: response.data }, { status: 500 });
        }
        // Fallback values to prevent undefined errors
        const btcPrice = response.data.data['BTC']?.quote?.USD?.price || 1;
        return NextResponse.json({
            symbol,
            price: quoteData.price || 0,
            change: quoteData.volume_change_24h || 0,
            changePercent: quoteData.percent_change_24h || 0,
            priceInBTC: quoteData.price / btcPrice,
            priceInUSD: quoteData.price || 0,
            lastUpdated: quoteData.last_updated || new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error fetching price data:', error);
        return NextResponse.json({
            error: 'Failed to fetch price data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
// Allow dynamic rendering
export const dynamic = 'auto';
