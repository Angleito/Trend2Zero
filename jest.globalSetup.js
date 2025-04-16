// jest.globalSetup.js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'child_process';
import logger from './backend/src/utils/logger.js';
import fetch from 'node-fetch';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function isPortInUse(port) {
  try {
    await execAsync(`lsof -i:${port}`);
    return true;
  } catch {
    return false;
  }
}

async function waitForServerStart(port, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server failed to start after ${maxAttempts} attempts`);
}

async function killProcessOnPort(port) {
  try {
    await execAsync(`lsof -t -i:${port} | xargs kill -9`);
  } catch (err) {
    // Ignore errors if no process was running
  }
}

export default async () => {
  let mongoServer;
  let devServer;

  try {
    // Start MongoDB
    logger.info('Setting up global test database...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`Global test database connected at ${mongoUri}`);

    // Store MongoDB instance and URI globally
    global.__MONGO_SERVER_INSTANCE__ = mongoServer;
    global.__MONGO_URI__ = mongoUri;
    process.env.MONGO_URI = mongoUri;

    // Kill any existing process on port 3000
    await killProcessOnPort(3000);

    // Start Next.js dev server
    logger.info('Starting Next.js development server...');
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3000' }
    });

    // Log server output
    devServer.stdout.on('data', (data) => {
      logger.info(`[Dev Server] ${data.toString()}`);
    });
    devServer.stderr.on('data', (data) => {
      logger.error(`[Dev Server Error] ${data.toString()}`);
    });

    // Store dev server instance globally for teardown
    global.__DEV_SERVER__ = devServer;

    // Wait for server to be ready with increased timeout
    logger.info('Waiting for development server to be ready...');
    await waitForServerStart(3000);
    logger.info('Development server started successfully');

  } catch (error) {
    logger.error('Error in global setup:', error);
    
    // Cleanup on error
    if (mongoServer) {
      await mongoServer.stop();
    }
    if (devServer) {
      devServer.kill();
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};
