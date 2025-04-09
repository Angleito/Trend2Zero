const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userRoutes = require('../routes/userRoutes');
const marketDataRoutes = require('../routes/marketDataRoutes');
const stocksRoutes = require('../routes/stocksRoutes');
const cryptoRoutes = require('../routes/cryptoRoutes');
const logger = require('../utils/logger');

let mongod;
let app;
let server;

/**
 * Create and configure Express app for testing
 */
const createApp = () => {
    const app = express();
    app.use(express.json());

    // Routes
    app.use('/api/users', userRoutes);
    app.use('/api/market-data', marketDataRoutes);
    app.use('/api/stocks', stocksRoutes);
    app.use('/api/crypto', cryptoRoutes);

    // Error handling
    app.use((err, req, res, next) => {
        logger.error('Error:', err);
        res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            message: err.message
        });
    });

    return app;
};

/**
 * Start test server and database
 */
const startServer = async () => {
    try {
        // Setup MongoDB Memory Server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        // Connect to in-memory database
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Create Express app
        app = createApp();

        // Start server
        server = app.listen(0); // Random port

        return {
            app,
            server,
            url: `http://localhost:${server.address().port}`
        };
    } catch (error) {
        logger.error('Error starting test server:', error);
        throw error;
    }
};

/**
 * Stop test server and database
 */
const stopServer = async () => {
    try {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
        }
        if (mongod) {
            await mongod.stop();
        }
    } catch (error) {
        logger.error('Error stopping test server:', error);
        throw error;
    }
};

/**
 * Clear test database
 */
const clearDatabase = async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    } catch (error) {
        logger.error('Error clearing test database:', error);
        throw error;
    }
};

/**
 * Get Express app instance
 */
const getApp = () => app;

/**
 * Get server instance
 */
const getServer = () => server;

module.exports = {
    startServer,
    stopServer,
    clearDatabase,
    getApp,
    getServer
};