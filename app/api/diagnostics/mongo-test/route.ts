
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';

export async function GET() {
  try {
    const conn = await dbConnect();
    return NextResponse.json({
      connected: true,
      dbName: conn.db?.databaseName ?? 'Unknown Database',
      host: conn.host
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('MongoDB connection error:', errorMessage);
    return NextResponse.json({
      connected: false,
      error: errorMessage
    }, { status: 500 });
  }
}
