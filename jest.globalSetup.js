// jest.globalSetup.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import logger from './backend/src/utils/logger.js'; // Adjust path as needed

export default async () => {
  let mongoServer;
  try {
    logger.info('Setting up global test database...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Optional: Add other mongoose connection options if needed
      // serverSelectionTimeoutMS: 5000 // Example
    });

    logger.info(`Global test database connected at ${mongoUri}`);

    // Store instance and URI globally for teardown and potential use in tests
    global.__MONGO_SERVER_INSTANCE__ = mongoServer;
    global.__MONGO_URI__ = mongoUri;
    // Optionally set process.env.MONGO_URI if your app relies on it
    process.env.MONGO_URI = mongoUri; 

  } catch (error) {
    logger.error('Error setting up global test database:', error);
    // Ensure teardown happens even if setup fails partially
    if (mongoServer) {
      await mongoServer.stop();
    }
    await mongoose.disconnect();
    process.exit(1); // Exit test run if setup fails
  }
};
