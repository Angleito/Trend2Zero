// jest.globalTeardown.js
import mongoose from 'mongoose';
import logger from './backend/src/utils/logger.js'; // Adjust path as needed

export default async () => {
  try {
    logger.info('Tearing down global test database...');
    
    // Disconnect Mongoose
    await mongoose.disconnect();
    logger.info('Global test database Mongoose connection closed.');

    // Stop the MongoMemoryServer instance
    if (global.__MONGO_SERVER_INSTANCE__) {
      await global.__MONGO_SERVER_INSTANCE__.stop();
      logger.info('Global test MongoMemoryServer stopped.');
    } else {
      logger.warn('MongoMemoryServer instance not found in global scope during teardown.');
    }

    // Stop development server
    const devServer = global.__DEV_SERVER__;
    if (devServer) {
      devServer.kill();
      logger.info('Development server stopped.');
    } else {
      logger.warn('Development server instance not found in global scope during teardown.');
    }

  } catch (error) {
    logger.error('Error during global test database teardown:', error);
    process.exit(1); // Exit with error code if teardown fails
  }
};
