import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/userModel';
import logger from '../utils/logger';

interface TestUserData {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

declare global {
  var createTestToken: (userId: string) => string;
  var createTestUser: (data?: TestUserData) => Promise<IUser>;
  var createAuthHeader: (token: string) => { Authorization: string };
}

let mongoServer: MongoMemoryServer;

const handleProcessError = (type: 'rejection' | 'exception', err: Error): void => {
  logger.error(`UNHANDLED ${type.toUpperCase()}! 💥 Shutting down...`, {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 100);
};

// Connect to the in-memory database before all tests
const setup = async (): Promise<void> => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

    // Set up environment variables
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
    
    // Temporarily modify environment
    const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'env');
    const modifiedEnv = { ...process.env, NODE_ENV: 'test' };
    
    Object.defineProperty(process, 'env', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: modifiedEnv
    });

    // Create helper functions on global object
    global.createTestToken = (userId: string): string => {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const options: SignOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] || '1h'
      };
      return jwt.sign({ id: userId }, process.env.JWT_SECRET, options);
    };

    global.createTestUser = async (data: TestUserData = {}): Promise<IUser> => {
      const defaultData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };

      return await User.create({ ...defaultData, ...data });
    };

    global.createAuthHeader = (token: string) => ({
      Authorization: `Bearer ${token}`
    });

    // Set up error handlers
    process.on('unhandledRejection', (err: Error) => handleProcessError('rejection', err));
    process.on('uncaughtException', (err: Error) => handleProcessError('exception', err));
    
  } catch (error) {
    logger.error('Error during test setup:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

// Clean up after all tests
const teardown = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    logger.error('Error during test teardown:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

export { setup as default, teardown };