import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

/**
 * Closes the MongoDB connection.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (clientPromise) {
    try {
      // Await the promise to get the client instance
      const resolvedClient = await clientPromise;
      // Close the connection
      await resolvedClient.close();
      console.log("MongoDB connection closed.");
      // Reset the global promise in dev mode if necessary, though closing should handle it.
      if (process.env.NODE_ENV === 'development') {
        global._mongoClientPromise = undefined;
      }
    } catch (e) {
      console.error("Error closing MongoDB connection:", e);
    } // No need to reset clientPromise itself, as the application might reconnect.
  }
}
