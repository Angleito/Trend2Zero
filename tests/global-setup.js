const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function globalSetup(config) {
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

    // Launch browser for diagnostics
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--enable-logging',
        '--v=1',
        '--no-sandbox',
        '--disable-web-security'
      ]
    });

    const context = await browser.newContext({
      recordVideo: {
        dir: path.join(__dirname, '..', 'test-results', 'videos', 'diagnostics'),
        size: { width: 1920, height: 1080 }
      }
    });

    const page = await context.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      const logFile = path.join(__dirname, '..', 'test-results', 'logs', 'browser-console.log');
      fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg.type()}: ${msg.text()}\n`);
    });

    // Navigate to a blank page to ensure browser is working
    await page.goto('about:blank');

    log('Diagnostic browser launched successfully');

    // Return cleanup function
    return async () => {
      log('Running global teardown');
      
      try {
        if (page) await page.close();
        if (context) await context.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        log(`Error during cleanup: ${cleanupError.message}`, 'error');
      }
    };
  } catch (error) {
    log(`Global setup failed: ${error.message}`, 'error');
    throw error;
  }
}

module.exports = globalSetup;
