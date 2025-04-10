// @ts-check
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  // Use baseURL from config instead of hardcoding
  // Add retry logic for better reliability
  let retries = 2;
  let lastError;

  while (retries > 0) {
    try {
      // Navigate to the homepage using baseURL from config
      await page.goto('/', { timeout: 15000 });

      // Wait for the page to load
      await page.waitForSelector('h1', { timeout: 5000 });

      // Verify that the page has a heading
      const title = await page.textContent('h1');
      console.log(`Found page title: ${title}`);
      expect(title).toBeTruthy();

      // Verify that the page has navigation links
      const hasNavLinks = await page.locator('nav a').count() > 0;
      console.log(`Found ${await page.locator('nav a').count()} navigation links`);
      expect(hasNavLinks).toBeTruthy();

      // Check for any buttons on the page
      const buttonCount = await page.locator('button').count();
      console.log(`Found ${buttonCount} buttons on the page`);

      // Check for any links on the page
      const linkCount = await page.locator('a').count();
      console.log(`Found ${linkCount} links on the page`);
      expect(linkCount).toBeGreaterThan(0);

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
