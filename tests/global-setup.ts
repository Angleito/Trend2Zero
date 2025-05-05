import { FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function isPortInUse(port: number): Promise<boolean> {
  try {
    await execAsync(`lsof -i:${port}`);
    return true;
  } catch {
    return false;
  }
}

async function waitForServerStart(port: number, maxAttempts = 30): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) {
        console.log(`[Setup] Server is ready on port ${port}`);
        return true;
      }
    } catch (err: unknown) {
      console.log(`[Setup] Waiting for server... (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server failed to start after ${maxAttempts} attempts`);
}

async function killProcessOnPort(port: number): Promise<void> {
  try {
    await execAsync(`lsof -t -i:${port} | xargs kill -9`);
    console.log(`[Setup] Killed existing process on port ${port}`);
  } catch (err) {
    // Ignore errors if no process was running
  }
}

async function globalSetup(config: FullConfig): Promise<void> {
  // Kill any existing process on port 3000
  await killProcessOnPort(3000);

  // Start Next.js dev server
  console.log('[Setup] Starting Next.js development server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '3000' }
  });

  // Log server output
  devServer.stdout?.on('data', (data) => {
    console.log(`[Dev Server] ${data.toString()}`);
  });
  devServer.stderr?.on('data', (data) => {
    console.error(`[Dev Server Error] ${data.toString()}`);
  });

  // Store dev server instance globally for teardown
  (globalThis as any).__DEV_SERVER__ = devServer;

  // Wait for server to be ready
  console.log('[Setup] Waiting for development server to be ready...');
  await waitForServerStart(3000);
  console.log('[Setup] Development server started successfully');
}

export default globalSetup;