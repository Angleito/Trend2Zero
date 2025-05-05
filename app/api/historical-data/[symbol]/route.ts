// app/api/historical-data/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const days = request.nextUrl.searchParams.get('days') || '30';

    const backendApiUrl = process.env.BACKEND_API_URL;
    if (!backendApiUrl) {
      return new Response(JSON.stringify({ error: 'Backend API URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch(`${backendApiUrl}/historical-data/${symbol}?days=${days}`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data from backend' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in historical data route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}