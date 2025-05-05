const { MongoClient } = require('mongodb');

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

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

/**
 * Closes the MongoDB connection.
 */
async function closeDatabaseConnection() {
    if (clientPromise) {
        try {
            const client = await clientPromise;
            await client.close();
            console.log('MongoDB connection closed successfully');
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
            throw error;
        }
    }
}

module.exports = {
    clientPromise,
    closeDatabaseConnection
};
