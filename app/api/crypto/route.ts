import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint === 'bitcoin-price') {
        try {
            const response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
                params: {
                    symbol: 'BTC',
                    convert: 'USD'
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
                }
            });

            const bitcoinData = response.data.data.BTC.quote.USD;

            return NextResponse.json({
                price: bitcoinData.price.toFixed(2),
                raw_data: {
                    market_cap: bitcoinData.market_cap,
                    percent_change_24h: bitcoinData.percent_change_24h
                }
            });
        } catch (error) {
            console.error('Bitcoin price fetch error:', error);
            return NextResponse.json({
                error: 'Failed to fetch Bitcoin price',
                details: (error as Error).message
            }, { status: 500 });
        }
    }

    return NextResponse.json({ message: "Unsupported endpoint" }, { status: 400 });
}
