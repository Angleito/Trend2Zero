const fs = require('fs');
const path = require('path');

async function globalSetup() {
  // Ensure test results directories exist
  const resultsDirs = [
    'test-results',
    'test-results/logs',
    'test-results/traces',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/archives',
    'test-results/html-report'
  ];

  resultsDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Logging function
  const log = (message, level = 'info') => {
    const logPath = path.join(__dirname, '..', 'test-results', 'logs', 'global-setup.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}\n`;

    fs.appendFileSync(logPath, logMessage);
    console.log(logMessage.trim());
  };

  try {
    log('Starting global setup for Trend2Zero tests');

    // Skip browser launch in global setup to save memory
    // Just create directories and log
    log('Skipping browser launch in global setup to save memory');

    // Create empty browser console log file
    const logFile = path.join(__dirname, '..', 'test-results', 'logs', 'browser-console.log');
    fs.writeFileSync(logFile, `${new Date().toISOString()} - Global setup initialized\n`);

    log('Global setup completed successfully');

    // Return empty cleanup function
    return async () => {
      log('Running global teardown');
    };
  } catch (error) {
    log(`Global setup failed: ${error.message}`, 'error');
    throw error;
  }
}

module.exports = globalSetup;
