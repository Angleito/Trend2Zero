import mongoose from 'mongoose';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trend2zero';
// Connection states as constants
export const ConnectionState = {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    DISCONNECTING: 3
};
// Ensure global is used to maintain a cached connection across hot reloads
const cached = globalThis.mongoose ?? { conn: null, promise: null };
// Ensure global.mongoose is set
globalThis.mongoose = cached;
async function dbConnect(retries = 3, delay = 1000) {
    // Check if in development mode
    const isDev = process.env.NODE_ENV !== 'production';
    
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
    
    // If in development mode and no MONGODB_URI is explicitly set, return a mock connection
    // that won't block development
    if (isDev && !process.env.MONGODB_URI) {
        console.warn('[MongoDB] Development mode: No MONGODB_URI set, using mock connection');
        // Create a mock connection object that won't block development
        cached.conn = {
            readyState: ConnectionState.CONNECTED,
            on: () => {},
            once: () => {},
            db: { collection: () => ({ find: () => ({ toArray: () => [] }) }) }, 
            connection: { db: () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }) }
        };
        return cached.conn;
    }
    
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
        }
        catch (error) {
            console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error);
            // Reset promise for next attempt
            cached.promise = null;
            
            // If in development, return a mock connection after the first attempt
            if (isDev) {
                console.warn('[MongoDB] Development mode: Using mock connection after failed attempt');
                cached.conn = {
                    readyState: ConnectionState.CONNECTED,
                    on: () => {},
                    once: () => {},
                    db: { collection: () => ({ find: () => ({ toArray: () => [] }) }) },
                    connection: { db: () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }) }
                };
                return cached.conn;
            }
            
            // Exponential backoff
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
            else {
                console.error('[MongoDB] All connection attempts failed');
                throw error;
            }
        }
    }
    throw new Error('[MongoDB] Unable to establish connection');
}
export default dbConnect;
