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
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = (globalThis as CustomGlobal).mongoose ?? { conn: null, promise: null };

// Ensure global.mongoose is set
(globalThis as CustomGlobal).mongoose = cached;

async function dbConnect(): Promise<mongoose.Connection> {
  // If connection already exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If no existing promise, create a new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('Connected to MongoDB');
      return mongooseInstance;
    });
  }
  
  try {
    // Await the connection promise and store the connection
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
    return cached.conn;
  } catch (e) {
    // Reset promise on connection failure
    cached.promise = null;
    console.error('Error connecting to MongoDB:', e);
    throw e;
  }
}

export default dbConnect;
