const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Ensure test results directories exist
const ensureDirectories = () => {
  const dirs = [
    'test-results/videos', 
    'test-results/traces', 
    'test-results/logs', 
    'test-results/screenshots'
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000, // Increased timeout for complex tests
  expect: {
    timeout: 30000 // More time for assertions
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI 
    ? [
        ['github'], 
        ['list'], 
        ['html', { outputFolder: 'test-results/html-report' }],
        ['json', { outputFile: 'test-results/test-results.json' }]
      ]
    : [
        ['list'], 
        ['html', { outputFolder: 'test-results/html-report' }],
        ['json', { outputFile: 'test-results/test-results.json' }]
      ],
  use: {
    actionTimeout: 45000,
    navigationTimeout: 90000,
    headless: false, // Keep browser visible for debugging
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    screenshot: 'on', // Capture screenshots for all tests
    video: 'on', // Record video for all tests
    trace: 'on', // Capture full trace for all tests
    launchOptions: {
      slowMo: 500, // Reduced delay between actions
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-logging', // Enable browser logging
        '--v=1' // Verbose logging level
      ]
    },
    contextOptions: {
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 1920, height: 1080 }
      },
      // Enhanced tracing for debugging
      tracing: {
        screenshots: true,
        snapshots: true,
        sources: true
      }
    }
  },
  projects: [
    {
      name: 'chromium-debug',
      use: { 
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end',
            '--enable-logging', // Detailed browser logging
            '--v=1' // Verbose logging
          ],
          // Enable more detailed console logging
          env: {
            BROWSER_LOGGING: 'true',
            MCP_DEBUG: 'true'
          }
        },
        // Additional debugging configurations
        contextOptions: {
          recordVideo: {
            dir: 'test-results/videos/chromium'
          }
        }
      },
    },
    // Optional: Add more browser configurations for comprehensive testing
    {
      name: 'firefox-debug',
      use: { 
        browserName: 'firefox',
        launchOptions: {
          // Firefox-specific debug options
          log: {
            level: 'debug'
          }
        }
      }
    }
  ],
  // Global setup and teardown for enhanced debugging
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js')
});
