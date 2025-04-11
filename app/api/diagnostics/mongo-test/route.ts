
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db/mongodb';

export async function GET() {
  try {
    const conn = await dbConnect();
    return NextResponse.json({
      connected: true,
      dbName: conn.db?.databaseName ?? null,
      host: conn.host
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
