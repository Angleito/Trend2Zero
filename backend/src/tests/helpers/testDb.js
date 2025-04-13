import mongoose from 'mongoose';
import logger from '../../utils/logger';
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

export const setupDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Test database connected');
    return {
      connection,
      disconnect: async () => {
        await mongoose.connection.close();
      }
    };
  } catch (error) {
    logger.error('Error setting up test database:', error);
    throw error;
  }
};

const setupTestDatabase = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
};

const clearTestData = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
};

const closeTestDatabase = async () => {
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
};

export default setupDatabase;

module.exports = {
    setupTestDatabase,
    clearTestData,
    closeTestDatabase
};