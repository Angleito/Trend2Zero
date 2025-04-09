const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),

  // Timeout configurations
  timeout: 120000, // 2 minutes total test timeout
  expect: {
    timeout: 30000 // 30 seconds for assertions
  },

  // Parallel test execution
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // Retry strategy
  retries: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,

  // Reporting configuration
  reporter: process.env.CI 
    ? [
        ['github'], 
        ['list'], 
        ['html', { 
          open: 'never', 
          outputFolder: 'test-results/html-report' 
        }],
        ['json', { 
          outputFile: 'test-results/test-results.json' 
        }]
      ]
    : [
        ['list'], 
        ['html', { 
          open: 'on-failure', 
          outputFolder: 'test-results/html-report' 
        }],
        ['json', { 
          outputFile: 'test-results/test-results.json' 
        }]
      ],

  // Default test configuration
  use: {
    // Browser settings
    headless: true, // Run in headless mode
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Debugging and tracing
    screenshot: 'only-on-failure', // Only capture screenshots for failed tests
    video: 'retain-on-failure', // Only keep videos for failed tests
    trace: 'retain-on-failure', // Only keep traces for failed tests
    
    // Action timeouts
    actionTimeout: 45000, // 45 seconds for individual actions
    navigationTimeout: 90000, // 90 seconds for page navigation
    
    // Browser launch options
    launchOptions: {
      slowMo: 0, // Remove delay between actions
      args: [
        '--headless', // Ensure headless mode
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu', // Disable GPU hardware acceleration
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--remote-debugging-port=9222', // Allow remote debugging without opening browser
        '--disable-web-security', // Disable web security for testing
        '--disable-site-isolation-trials', // Reduce resource usage
        '--disable-background-networking', // Minimize network activity
        '--disable-default-apps', // Disable default apps
        '--disable-extensions', // Disable browser extensions
        '--disable-sync' // Disable browser sync
      ],
      
      // Environment variables for minimal interaction
      env: {
        DISPLAY: ':99', // Use virtual display
        PLAYWRIGHT_HEADLESS: '1',
        NODE_ENV: 'test'
      }
    },
    
    // Context options for minimal resource usage
    contextOptions: {
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 1920, height: 1080 }
      },
      tracing: {
        screenshots: false, // Disable screenshots to reduce resource usage
        snapshots: false,
        sources: false
      }
    }
  },

  // Browser-specific configurations
  projects: [
    {
      name: 'chromium-headless',
      use: { 
        browserName: 'chromium',
        headless: true,
        launchOptions: {
          args: [
            '--headless', 
            '--no-sandbox', 
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-background-networking'
          ]
        }
      }
    },
    {
      name: 'firefox-headless',
      use: { 
        browserName: 'firefox',
        headless: true,
        launchOptions: {
          args: [
            '--headless'
          ]
        }
      }
    }
  ]
});
