const mongoose = require('mongoose');
const logger = require('../backend/src/utils/logger');

const setupTestDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Test database connected');
    return connection;
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  }
};

const closeTestDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Test database connection closed');
  } catch (error) {
    logger.error('Error closing test database:', error);
    throw error;
  }
};

const clearTestData = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.info('Test data cleared');
  } catch (error) {
    logger.error('Error clearing test data:', error);
    throw error;
  }
};

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  clearTestData
};