import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 1 : undefined,
  
  // Enhanced reporting
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  
  use: {
    // Improved tracing and debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Base configuration
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    
    // Enhanced timeout handling
    actionTimeout: 30000,
    navigationTimeout: 45000,
    
    // Reduce flakiness
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  },
  
  // Projects with different browser configurations
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        launchOptions: {
          slowMo: 100, // Add slight delay to reduce race conditions
          headless: false
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        screenshot: 'on',
        launchOptions: {
          slowMo: 100,
          headless: false
        }
      },
    }
  ],
  
  // Visual regression snapshot configuration
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      maxDiffPixels: 100
    }
  },
  
  // Snapshot and result directories
  snapshotDir: './tests/__snapshots__',
  outputDir: './test-results',
});