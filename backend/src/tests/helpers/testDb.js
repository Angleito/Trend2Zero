const mongoose = require('mongoose');
const Asset = require('../../models/assetModel');
const User = require('../../models/userModel');
const logger = require('../../utils/logger');

/**
 * Create a test asset
 * @param {Object} assetData - Asset data
 * @returns {Promise<Object>} Created asset
 */
const createTestAsset = async (assetData = {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    popularity: 100,
    lastPrice: 50000,
    currency: 'USD'
}) => {
    try {
        return await Asset.create(assetData);
    } catch (error) {
        logger.error('Error creating test asset:', error);
        throw error;
    }
};

/**
 * Create a test user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createTestUser = async (userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    passwordConfirm: 'password123'
}) => {
    try {
        return await User.create(userData);
    } catch (error) {
        logger.error('Error creating test user:', error);
        throw error;
    }
};

/**
 * Clear all test data
 */
const clearTestData = async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
        logger.info('Test database cleared');
    } catch (error) {
        logger.error('Error clearing test data:', error);
        throw error;
    }
};

module.exports = {
    createTestAsset,
    createTestUser,
    clearTestData
};