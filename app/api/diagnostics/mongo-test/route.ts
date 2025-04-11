import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock data for Vercel deployment
    return NextResponse.json({
      connected: false,
      message: 'MongoDB connection not available in production build'
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({
      connected: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
