import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';

interface MongoTestResult {
  connected: boolean;
  dbName?: string;
  host?: string;
  error?: string;
  mockData?: boolean;
  environment?: Record<string, string>;
}

export async function GET() {
  // Check environment variables
  const environment = {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'Not set'
  };

  try {
    // If mock data is enabled and MongoDB URI is not set, return mock data
    if (process.env.USE_MOCK_DATA === 'true' && !process.env.MONGODB_URI) {
      console.log('Using mock data for MongoDB connection');
      return NextResponse.json({
        connected: true,
        dbName: 'mock-trend2zero',
        host: 'localhost:27017',
        mockData: true,
        environment
      });
    }

    const conn = await dbConnect();
    return NextResponse.json({
      connected: true,
      dbName: conn.db?.databaseName || 'unknown',
      host: conn.host,
      mockData: false,
      environment
    });
  } catch (error: unknown) {
    console.error('MongoDB connection error:', error);

    // If connection fails and mock data is enabled, return mock data
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('Falling back to mock data for MongoDB connection');
      return NextResponse.json({
        connected: true,
        dbName: 'mock-trend2zero',
        host: 'localhost:27017',
        mockData: true,
        environment
      });
    }

    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      environment
    }, { status: 500 });
  }
}
