const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { 
    // setupTestDatabase, // Now handled globally
    // closeTestDatabase // Now handled globally
} = require('./helpers/testDb');
const { createTestServer } = require('./testUtils'); // Correct path

const logger = require('../utils/logger');
const express = require('express');
const cors = require('cors');
const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');

// Setup and teardown for all tests
let appInstance = null;
let serverInstance = null;

beforeAll(async () => {
    logger.info('Setting up test environment...');
    const { app, server } = await createTestServer(); 
    appInstance = app;      // Store the app instance
    serverInstance = server; // Store the server instance (already listening)
});

afterAll(async () => {
    // Close the server if it exists and was started
    if (serverInstance && serverInstance.close) {
        serverInstance.close((err) => {
            if (err) {
                logger.error('Error closing test server:', err);
                process.exit(1);
            }
        });
    }
});

// Optional: Set mongoose to use ES6 Promises
mongoose.Promise = global.Promise;

// Optional: Configure jest timeout
jest.setTimeout(30000);

// Mock logger
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

// Create a fresh app instance for each test
function getApp() {
    // Return the app instance created in beforeAll
    // Ensure it's created if somehow it wasn't (defensive)
    if (!appInstance) {
        console.error("appInstance not created in beforeAll! Recreating...");
        // This indicates a setup problem, but let's try to recover
        const { app } = createTestServer(); // Note: createTestServer might need to be async
        appInstance = app;
    } 
    return appInstance;
}

// Export setup and teardown functions
module.exports = {
    logger,
    getApp,
    serverInstance: serverInstance 
};
