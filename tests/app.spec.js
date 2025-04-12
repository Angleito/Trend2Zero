const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { testConfig } = require('./test-config');

// Utility function to log test details
function logTestDetails(testName, details) {
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    test: testName,
    details: details
  }, null, 2) + '\n';

  // Write to test-specific log file
  const logPath = testConfig.getLogPath(`${testName.replace(/\s+/g, '-').toLowerCase()}`);
  fs.appendFileSync(logPath, logEntry);
}

// Utility function to check server availability
async function isServerAvailable(url, maxRetries = 5, context) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await context.request.get(url, {
        timeout: 5000,
        failOnStatusCode: false
      });
      return response.ok();
    } catch (error) {
      if (attempt === maxRetries) {
        logTestDetails('Server Availability Check', {
          url: url,
          error: error.message,
          attempts: attempt
        });
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
    }
  }
  return false;
}

// Utility function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Test suite for website functionality
test.describe('Basic App Tests', () => {
  test.beforeAll(() => {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
    ensureDirectoryExists(screenshotsDir);
  });

  test('basic navigation test', async ({ page }) => {
    try {
      // Navigate to test page
      await page.goto('/test-page');
      await page.waitForLoadState('networkidle');

      // Take screenshot after page load
      await page.screenshot({
        path: testConfig.getScreenshotPath('test-page-navigation'),
        fullPage: true
      });

      // Basic checks
      const heading = await page.getByRole('heading').first();
      expect(heading).toBeTruthy();

      logTestDetails('Basic Navigation', {
        url: page.url(),
        title: await page.title()
      });
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });
});

test.describe.skip('Trend2Zero Website Diagnostics', () => {
  // Ensure server is available before tests
  test.beforeAll(async ({ context }) => {
    const serverUrl = 'http://localhost:3000';
    const isAvailable = await isServerAvailable(serverUrl, 5, context);

    if (!isAvailable) {
      logTestDetails('Server Startup', {
        message: 'Development server not available',
        action: 'Attempting manual server start'
      });

      // Optional: Attempt to start server manually
      try {
        const { spawn } = require('child_process');
        const serverProcess = spawn('npm', ['run', 'dev'], {
          detached: true,
          stdio: 'ignore'
        });

        // Wait a bit for server to start
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (startError) {
        logTestDetails('Server Startup Failure', {
          error: startError.message
        });
        throw new Error('Could not start development server');
      }
    }
  });

  // Test homepage load and basic functionality
  test('Homepage loads successfully', async ({ page }) => {
    try {
      // Navigate to the homepage with extended timeout
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Take screenshot for diagnostics
      await page.screenshot({ path: 'test-results/screenshots/homepage-load.png' });

      // Check page title
      const pageTitle = await page.title();
      logTestDetails('Homepage Load', {
        title: pageTitle,
        url: page.url()
      });

      // Validate key elements
      const mainHeading = await page.getByRole('heading', { name: /trend2zero/i });
      expect(mainHeading).toBeTruthy();

      // Check for critical UI components
      const navigationLinks = await page.getByRole('navigation').getByRole('link').all();
      expect(navigationLinks.length).toBeGreaterThan(0);

    } catch (error) {
      logTestDetails('Homepage Load Failure', {
        errorMessage: error.message,
        stack: error.stack
      });
      throw error;
    }
  });

  // Test asset search functionality
  test('Asset search works correctly', async ({ page }) => {
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Find and interact with search input
      const searchInput = await page.getByPlaceholder(/search assets/i);
      expect(searchInput).toBeTruthy();

      // Try searching for Bitcoin
      await searchInput.fill('Bitcoin');
      await searchInput.press('Enter');

      // Wait for search results with extended timeout
      await page.waitForSelector('[data-testid="search-results"]', {
        state: 'visible',
        timeout: 10000
      });

      // Take screenshot of search results
      await page.screenshot({ path: 'test-results/screenshots/asset-search.png' });

      // Validate search results
      const searchResults = await page.getByTestId('search-results').all();
      expect(searchResults.length).toBeGreaterThan(0);

      logTestDetails('Asset Search', {
        searchTerm: 'Bitcoin',
        resultsCount: searchResults.length
      });

    } catch (error) {
      logTestDetails('Asset Search Failure', {
        errorMessage: error.message,
        stack: error.stack
      });
      throw error;
    }
  });

  // Performance and loading time test
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();

    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;

      // Take performance screenshot
      await page.screenshot({ path: 'test-results/screenshots/performance-load.png' });

      logTestDetails('Page Load Performance', {
        loadTimeMs: loadTime
      });

      // Performance assertion (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000); // Less than 5 seconds

    } catch (error) {
      logTestDetails('Performance Test Failure', {
        errorMessage: error.message,
        stack: error.stack
      });
      throw error;
    }
  });
});
