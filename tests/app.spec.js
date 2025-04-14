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

  const logPath = testConfig.getLogPath(`${testName.replace(/\s+/g, '-').toLowerCase()}`);
  fs.appendFileSync(logPath, logEntry);
}

// Utility function to check server availability
async function isServerAvailable(context) {
  try {
    const response = await context.request.get(testConfig.server.baseUrl, {
      timeout: 5000,
      failOnStatusCode: false
    });
    return response.ok();
  } catch (error) {
    return false;
  }
}

// Test suite for website functionality
test.describe('Basic App Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Ensure server is available
    const serverRunning = await isServerAvailable(context);
    if (!serverRunning) {
      throw new Error(`Server not available at ${testConfig.server.baseUrl}`);
    }
  });

  test('Homepage loads successfully', async ({ page }) => {
    try {
      await page.goto(testConfig.server.baseUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const pageTitle = await page.title();
      expect(pageTitle).toContain('Trend2Zero');

      // Take screenshot for diagnostics
      await page.screenshot({ path: testConfig.getScreenshotPath('homepage-load') });

      // Log test details
      logTestDetails('Homepage Load', {
        title: pageTitle,
        url: page.url()
      });
    } catch (error) {
      logTestDetails('Homepage Load Failure', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  });

  test('Asset search works correctly', async ({ page }) => {
    try {
      await page.goto(testConfig.server.baseUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Find and interact with search input
      const searchInput = await page.getByPlaceholder(/search assets/i);
      expect(searchInput).toBeTruthy();

      // Try searching for Bitcoin
      await searchInput.fill('Bitcoin');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]', {
        state: 'visible',
        timeout: 10000
      });

      // Take screenshot of search results
      await page.screenshot({ path: testConfig.getScreenshotPath('asset-search') });

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
});
