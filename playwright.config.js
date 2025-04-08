// @ts-check
/**
 * IMPORTANT: This project uses Playwright exclusively for browser testing and debugging.
 * Do not use manual browser testing or other testing frameworks.
 * All browser-related components should be tested using this approach.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  /* Global setup and teardown scripts */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000, // Increased from 30 to 60 seconds
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', {
      open: 'chromium',
      outputFolder: 'playwright-report'
    }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 30000, // 30 seconds
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshots on failure */
    screenshot: 'only-on-failure',

    /* Record video */
    video: 'on-first-retry',

    /* Show browser window during test */
    headless: false,

    /* Increase default timeout for waiting for selectors */
    navigationTimeout: 30000,
    waitForSelector: {
      state: 'visible',
      timeout: 30000
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
});
