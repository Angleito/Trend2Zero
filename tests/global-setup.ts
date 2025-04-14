import { FullConfig, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import net from 'net';

async function checkServerRunning(ports: number[]): Promise<number | null> {
  for (const port of ports) {
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

      if (connection) return port;
    } catch {
      continue;
    }
  }
  return null;
}

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Checking development server...');
  
  // Check both ports 3000 and 3001
  const runningPort = await checkServerRunning([3000, 3001]);
  if (!runningPort) {
    // Start the development server in the background
    execSync('npm run dev &', { stdio: 'ignore' });

    // Wait for server to be ready on either port
    const serverPort = await checkServerRunning([3000, 3001]);
    if (!serverPort) {
      throw new Error('Development server failed to start');
    }
  }

  // Set the port in process.env for tests to use
  process.env.TEST_SERVER_PORT = String(runningPort);
  console.log(`Development server is running on port ${runningPort}`);
}

export default globalSetup;