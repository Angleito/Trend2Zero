// @ts-check
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * @type {import('@playwright/test').FullConfig}
 */
module.exports = async function globalTeardown() {
  console.log('Tearing down development server...');
  
  // Read the server PID from the file
  const pidFile = path.join(process.cwd(), '.server-pid');
  
  if (fs.existsSync(pidFile)) {
    try {
      const pid = fs.readFileSync(pidFile, 'utf8');
      console.log(`Killing server process with PID: ${pid}`);
      
      // Different kill commands based on platform
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${pid} /T /F`);
      } else {
        // For macOS and Linux
        execSync(`kill -9 ${pid}`);
      }
      
      console.log('Server process killed successfully');
    } catch (error) {
      console.error(`Error killing server process: ${error.message}`);
    } finally {
      // Remove the PID file
      fs.unlinkSync(pidFile);
    }
  } else {
    console.log('No server PID file found, assuming server was not started by tests');
  }
};
