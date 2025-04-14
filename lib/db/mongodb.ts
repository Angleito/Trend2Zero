import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trend2zero';

// Define the type for the mongoose cache
interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Mongoose> | null;
}

// Custom interface to extend the global object with mongoose property
interface CustomGlobal {
  mongoose?: MongooseCache;
}

// Extend the global object with our mongoose cache type
declare global {
  namespace NodeJS {
    interface Global {
      mongoose?: MongooseCache;
    }
  }
}

// Connection states as constants
export const ConnectionState = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

// Ensure global is used to maintain a cached connection across hot reloads
const cached: MongooseCache = (globalThis as CustomGlobal).mongoose ?? { conn: null, promise: null };

// Ensure global.mongoose is set
(globalThis as CustomGlobal).mongoose = cached;

async function dbConnect(retries = 3, delay = 1000): Promise<mongoose.Connection> {
  // If connection already exists, return it
  if (cached.conn) {
    console.log('[MongoDB] Reusing existing connection');
    return cached.conn;
  }

  // Connection options with enhanced configuration
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // 5 seconds server selection timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    family: 4 // Use IPv4, helps with some network configurations
  };

  // Retry connection with exponential backoff
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${retries}`);

      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
          console.log('[MongoDB] Successfully connected');
          return mongooseInstance;
        });
      }

      const mongooseInstance = await cached.promise;
      cached.conn = mongooseInstance.connection;

      // Additional connection state logging
      cached.conn.on('connected', () => console.log('[MongoDB] Connection established'));
      cached.conn.on('error', (err) => console.error('[MongoDB] Connection error:', err));
      cached.conn.on('disconnected', () => console.warn('[MongoDB] Disconnected'));

      return cached.conn;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error);
      
      // Reset promise for next attempt
      cached.promise = null;

      // Exponential backoff
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } else {
        console.error('[MongoDB] All connection attempts failed');
        throw error;
      }
    }
  }

  throw new Error('[MongoDB] Unable to establish connection');
}

export default dbConnect;
