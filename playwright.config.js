const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Web server configuration - only start server if not in CI
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
  // Test directory
  testDir: './tests',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),

  // Timeout configurations
  timeout: 60000, // 1 minute total test timeout (reduced from 3 minutes)
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  // Parallel test execution - limit to reduce memory usage
  fullyParallel: false, // Changed to false to reduce memory usage
  workers: 1, // Limit to 1 worker to prevent memory issues

  // Retry strategy
  retries: 0, // Disable retries to reduce memory usage
  forbidOnly: !!process.env.CI,

  // Reporting configuration - simplified
  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: 'playwright-report'
    }]
  ],

  // Default test configuration
  use: {
    // Add baseURL to fix the invalid URL errors
    baseURL: 'http://localhost:3000',

    // Browser settings
    headless: true,
    viewport: { width: 1280, height: 720 }, // Reduced size to save memory
    ignoreHTTPSErrors: true,

    // Debugging and tracing - minimize to reduce memory usage
    screenshot: 'only-on-failure',
    video: 'off', // Disable video to save memory
    trace: 'off', // Disable trace to save memory

    // Action timeouts
    actionTimeout: 15000, // Reduced from 45s to 15s
    navigationTimeout: 30000, // Reduced from 90s to 30s

    // Browser launch options - optimized for memory efficiency
    launchOptions: {
      args: [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--mute-audio',
        '--disable-web-security',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync'
      ]
    }
  },

  // Browser-specific configurations - only use chromium to save resources
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: true
      }
    }
  ]
});
