// @ts-check
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
let server;

/**
 * @type {import('@playwright/test').FullConfig}
 */
module.exports = async function globalSetup() {
  console.log('Starting development server...');

  // Check if server is already running on port 3000 or 3001
  let serverPort = 3000;
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Try port 3000 first
    try {
      await page.goto('http://localhost:3000', { timeout: 3000 });
      serverPort = 3000;
      await browser.close();
      console.log('Server is already running on port 3000, skipping server start');
      return;
    } catch (error) {
      // If port 3000 fails, try port 3001
      try {
        await page.goto('http://localhost:3001', { timeout: 3000 });
        serverPort = 3001;
        await browser.close();
        console.log('Server is already running on port 3001, skipping server start');
        return;
      } catch (error) {
        console.log('Server is not running on either port, starting it now');
      }
    }

    await browser.close();
  } catch (error) {
    console.log('Error checking server status:', error);
    console.log('Starting server anyway');
  }

  // Start the development server
  server = spawn('npm', ['run', 'dev'], {
    shell: true,
    stdio: 'pipe', // Capture output
    cwd: process.cwd(),
  });

  // Log server output
  server.stdout.on('data', (data) => {
    console.log(`Server stdout: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`Server stderr: ${data}`);
  });

  // Save the server PID to a file for teardown
  const pidFile = path.join(process.cwd(), '.server-pid');
  fs.writeFileSync(pidFile, server.pid.toString());

  // Wait for the server to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Try to connect to the server with retries
  let isServerReady = false;
  let detectedPort = null;

  for (let i = 0; i < 30; i++) { // Increased retries to 30 with 1-second intervals
    try {
      console.log(`Attempt ${i + 1} to connect to server...`);

      // Try port 3000 first
      try {
        await page.goto('http://localhost:3000', { timeout: 3000 });
        detectedPort = 3000;
        isServerReady = true;
        console.log('Server is ready on port 3000!');
        break;
      } catch (error3000) {
        // If port 3000 fails, try port 3001
        try {
          await page.goto('http://localhost:3001', { timeout: 3000 });
          detectedPort = 3001;
          isServerReady = true;
          console.log('Server is ready on port 3001!');
          break;
        } catch (error3001) {
          throw new Error(`Both ports failed: 3000 (${error3000.message}) and 3001 (${error3001.message})`);
        }
      }
    } catch (error) {
      console.log(`Server not ready yet, retrying in 1 second... (${error.message})`);
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save the detected port to a file for tests to use
  if (detectedPort) {
    const portFile = path.join(process.cwd(), '.server-port');
    fs.writeFileSync(portFile, detectedPort.toString());
    console.log(`Saved detected port ${detectedPort} to .server-port file`);
  } else {
    // If no port was detected, default to 3001
    const portFile = path.join(process.cwd(), '.server-port');
    fs.writeFileSync(portFile, '3001');
    console.log('No port detected, defaulting to 3001');
  }

  await browser.close();

  if (!isServerReady) {
    throw new Error('Failed to start development server after 30 attempts');
  }
};

module.exports.server = server;
