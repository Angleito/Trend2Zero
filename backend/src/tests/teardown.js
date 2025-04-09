const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

/**
 * Global teardown module for cleaning up after tests
 */
module.exports = async function() {
    // Clean up any remaining database connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }

    // Stop the in-memory MongoDB instance
    const mongod = await MongoMemoryServer.create();
    if (mongod) {
        await mongod.stop();
    }

    // Clean up any remaining test files
    const testUploadsDir = path.join(__dirname, '../uploads/test');
    if (fs.existsSync(testUploadsDir)) {
        fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }

    // Clean up any test logs
    const testLogsDir = path.join(__dirname, '../logs/test');
    if (fs.existsSync(testLogsDir)) {
        fs.rmSync(testLogsDir, { recursive: true, force: true });
    }

    // Reset environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.NODE_ENV;

    // Clear any remaining event listeners
    process.removeAllListeners();
};