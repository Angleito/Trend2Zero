const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { setupTestDatabase, clearTestData, closeTestDatabase } = require('./helpers/testDb');
const logger = require('../utils/logger');
const express = require('express');
const cors = require('cors');
const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');

const { connectTestDb, disconnectTestDb } = require('./utils/testDb');

// Setup and teardown for all tests
beforeAll(async () => {
    await connectTestDb();
});

afterAll(async () => {
    await disconnectTestDb();
});

// Optional: Set mongoose to use ES6 Promises
mongoose.Promise = global.Promise;

// Optional: Configure jest timeout
jest.setTimeout(30000);

let mongoServer;
let app;

// Mock logger
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

// Connect to the in-memory database before all tests
const setup = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    // Set up environment variables
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    // Create helper functions on global object
    global.createTestToken = (userId) => {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
    };

    global.createTestUser = async (data = {}) => {
        const defaultData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            passwordConfirm: 'password123'
        };

        const userData = { ...defaultData, ...data };
        return await User.create(userData);
    };

    global.createAuthHeader = (token) => ({
        Authorization: `Bearer ${token}`
    });

    // Set up error handlers
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    });
};

// Clean up after all tests
const teardown = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }

    if (mongoServer) {
        await mongoServer.stop();
    }
};

beforeAll(async () => {
    await setupTestDatabase();
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

beforeEach(async () => {
    await clearTestData();
});

afterAll(async () => {
    await closeTestDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Create a fresh app instance for each test
function getApp() {
    if (!app) {
        app = express();
        app.use(cors());
        app.use(express.json());
        app.use('/api', routes);
        app.use(errorHandler);
    }
    return app;
}

// Export setup and teardown functions
module.exports = setup;
module.exports.teardown = teardown;
module.exports = {
    setupTestDatabase,
    clearTestData,
    closeTestDatabase,
    logger,
    getApp
};
