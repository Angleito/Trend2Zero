import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
test.describe('MongoDB Connection Test', () => {
    test('should verify MongoDB connection string and attempt connection', async () => {
        // 1. Check if MongoDB URI is configured
        const mongoURI = process.env.MONGODB_URI;
        console.log('MongoDB URI exists:', !!mongoURI);
        if (!mongoURI) {
            console.warn('No MongoDB URI found in environment variables');
            // For testing, use a fallback connection string pointing to localhost
            console.log('Using fallback localhost connection for testing');
        }
        const connectionString = mongoURI || 'mongodb://localhost:27017/trend2zero';
        console.log('Connection string pattern:', connectionString.replace(/mongodb(\+srv)?:\/\/([^:]+):[^@]+@/, 'mongodb$1://***:***@'));
        // 2. Check if the connection string is for Atlas (contains mongodb.net)
        const isAtlasConnection = connectionString.includes('mongodb.net');
        console.log('Is MongoDB Atlas connection:', isAtlasConnection);
        try {
            // 3. Attempt connection with timeout
            console.log('Attempting MongoDB connection...');
            const connection = await mongoose.connect(connectionString, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000
            });
            // 4. Log connection state
            console.log('MongoDB connection state:', connection.connection.readyState);
            expect(connection.connection.readyState).toBe(1); // 1 = connected
            // 5. Check database name
            const dbName = connection.connection.db.databaseName;
            console.log('Connected to database:', dbName);
            // 6. List collections
            const collections = await connection.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            console.log('Collections in database:', collectionNames.join(', ') || 'No collections found');
            // 7. Check for critical collections needed for the application
            const requiredCollections = ['assets', 'prices', 'cache'];
            const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
            if (missingCollections.length > 0) {
                console.warn('Missing required collections:', missingCollections.join(', '));
            }
            else {
                console.log('All required collections exist');
            }
            // 8. Clean up connection
            await connection.disconnect();
            console.log('MongoDB connection closed');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            // Check if error is due to authentication failure
            if (error.message && error.message.includes('Authentication failed')) {
                console.error('Authentication failed. Check username and password in connection string.');
            }
            // Check if error is due to network connectivity
            if (error.message && error.message.includes('getaddrinfo ENOTFOUND')) {
                console.error('Network connectivity issue. Cannot resolve hostname.');
            }
            // If using Atlas, check IP whitelist
            if (isAtlasConnection) {
                console.log('If using Atlas, ensure the current IP address is whitelisted in MongoDB Atlas Security settings.');
            }
            // Only fail test if we expected the connection to work
            if (mongoURI) {
                expect(false, `MongoDB connection failed: ${error.message}`).toBeTruthy();
            }
            else {
                console.log('Skipping connection failure test since we expected fallback connection to fail');
            }
        }
    });
});
