import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Fallback to handle case where path resolution fails
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trend2zero';

async function dbConnect() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    return client.db();
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function GET() {
  try {
    const db = await dbConnect();
    return NextResponse.json({
      connected: true,
      dbName: db.databaseName,
      host: MONGO_URI.split('@').pop()?.split('/')[0] || 'unknown'
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json({
      connected: false,
      error: error.message
    }, { status: 500 });
  }
}
