// @ts-check
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  // Add retry logic for better reliability
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      // Navigate to the tracker page
      await page.goto('http://localhost:3000/tracker', { timeout: 30000 });

      // Wait for the page to load
      await page.waitForSelector('h1:has-text("Asset Tracker")', { timeout: 10000 });

      // Verify that the page title is correct
      const title = await page.textContent('h1');
      expect(title).toBe('Asset Tracker');

      // Verify that the asset table is displayed
      // Wait for table rows to be visible, which is more reliable than checking the table element itself
      await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 });

      // Now check if the table is attached to the DOM
      const table = await page.locator('table').first();
      await expect(table).toBeAttached();

      // Verify that the search input is displayed
      const searchInput = await page.locator('input[placeholder="Search assets..."]');
      expect(await searchInput.isVisible()).toBe(true);

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
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
});
