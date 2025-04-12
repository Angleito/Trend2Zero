import { FullConfig, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import net from 'net';

async function checkServerRunning(port: number, maxAttempts = 10): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const socket = new net.Socket();
      const connection = await new Promise<boolean>((resolve, reject) => {
        socket.setTimeout(1000);
        socket.once('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.once('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.once('error', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(port, 'localhost');
      });

      if (connection) return true;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Starting development server...');
  
  // Check if server is already running
  const isRunning = await checkServerRunning(3000);
  if (!isRunning) {
    // Start the development server in the background
    execSync('npm run dev &', { stdio: 'ignore' });

    // Wait for server to be ready
    const serverReady = await checkServerRunning(3000);
    if (!serverReady) {
      throw new Error('Development server failed to start');
    }
  }

  console.log('Development server is running');
}

export default globalSetup;