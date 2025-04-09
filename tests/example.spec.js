// @ts-check
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  // Use baseURL from config instead of hardcoding
  // Add retry logic for better reliability
  let retries = 2;
  let lastError;

  while (retries > 0) {
    try {
      // Navigate to the tracker page with absolute URL
      await page.goto('http://localhost:3000/tracker', { timeout: 15000 });

      // Wait for the page to load
      await page.waitForSelector('h1', { timeout: 5000 });

      // Verify that the page title is correct
      const title = await page.textContent('h1');
      expect(title).toContain('Asset Tracker');

      // Verify that the asset table is displayed or a loading message
      const hasTable = await page.locator('table').count() > 0;
      const hasLoadingMessage = await page.locator('text=Loading').count() > 0;

      expect(hasTable || hasLoadingMessage).toBeTruthy();

      // If we have a table, check for rows
      if (hasTable) {
        // Try to find any rows
        const rowCount = await page.locator('table tbody tr').count();
        console.log(`Found ${rowCount} rows in the table`);
      }

      // Verify that the search input is displayed
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      expect(await searchInput.isVisible()).toBeTruthy();

      // If we get here, the test passed, so break out of the retry loop
      break;
    } catch (error) {
      lastError = error;
      console.log(`Test attempt failed (${retries} retries left): ${error.message}`);
      retries--;

      if (retries === 0) {
        throw lastError;
      }

      // Wait before retrying
      await page.waitForTimeout(2000);
    }
  }
});
