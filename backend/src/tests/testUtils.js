const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const logger = require('../utils/logger');

let mongod;
let testServers = [];

/**
 * Setup test database
 */
const setupDatabase = async () => {
    try {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        return mongoose.connection;
    } catch (err) {
        logger.error('Error setting up test database:', err);
        throw err;
    }
};

/**
 * Create test server
 */
const createTestServer = async () => {
    const app = express();
    app.use(express.json());

    // Add routes
    const userRoutes = require('../routes/userRoutes');
    const marketDataRoutes = require('../routes/marketDataRoutes');
    const stocksRoutes = require('../routes/stocksRoutes');
    const cryptoRoutes = require('../routes/cryptoRoutes');

    app.use('/api/users', userRoutes);
    app.use('/api/market-data', marketDataRoutes);
    app.use('/api/stocks', stocksRoutes);
    app.use('/api/crypto', cryptoRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
        logger.error('Error:', err);
        res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            message: err.message
        });
    });

    const server = app.listen(0); // Random port
    testServers.push(server);
    return server;
};

/**
 * Close all test servers
 */
const closeTestServers = async () => {
    for (const server of testServers) {
        await new Promise(resolve => server.close(resolve));
    }
    testServers = [];
};

/**
 * Clear test database
 */
const clearTestDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};

/**
 * Close test database
 */
const closeTestDatabase = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
};

/**
 * Create test token
 */
const createTestToken = (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

module.exports = {
    setupDatabase,
    createTestServer,
    closeTestServers,
    clearTestDatabase,
    closeTestDatabase,
    createTestToken
};
