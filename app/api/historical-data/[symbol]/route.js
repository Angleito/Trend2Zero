// app/api/historical-data/[symbol]/route.ts
import { NextResponse } from 'next/server';
export async function GET(request, { params }) {
    const { searchParams } = new URL(request.url);
    const symbol = params.symbol;
    const days = searchParams.get('days') || '30'; // Default to 30 days if not specified
    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }
    const backendUrl = process.env.BACKEND_API_URL; // Ensure this environment variable is set
    if (!backendUrl) {
        console.error("BACKEND_API_URL environment variable is not set.");
        return NextResponse.json({ error: 'Backend URL is not configured' }, { status: 500 });
    }
    try {
        // Construct the backend URL, assuming the backend historical data route is /historical-data/:symbol
        const backendApiUrl = `${backendUrl}/historical-data/${symbol}?days=${days}`;
        const backendResponse = await fetch(backendApiUrl);
        if (!backendResponse.ok) {
            // Forward backend errors to the frontend
            const errorBody = await backendResponse.json();
            return NextResponse.json(errorBody, { status: backendResponse.status });
        }
        const data = await backendResponse.json();
        return NextResponse.json(data);
    }
    catch (error) {
        console.error(`Error fetching historical data for ${symbol} from backend:`, error);
        return NextResponse.json({ error: 'Failed to fetch historical data', details: error.message }, { status: 500 });
    }
}
