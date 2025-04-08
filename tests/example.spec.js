// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Read the server port from the file created by global-setup.js
function getServerPort() {
  try {
    const portFile = path.join(process.cwd(), '.server-port');
    if (fs.existsSync(portFile)) {
      const port = fs.readFileSync(portFile, 'utf8');
      return port.trim();
    }
  } catch (error) {
    console.error('Error reading server port file:', error);
  }
  return '3000'; // Default to 3000 if file doesn't exist
}

test('basic test', async ({ page }) => {
  const serverPort = getServerPort();
  // Add retry logic for better reliability
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      // Navigate to the tracker page
      await page.goto(`http://localhost:${serverPort}/tracker`, { timeout: 30000 });

      // Wait for the page to load
      await page.waitForSelector('h1:has-text("Asset Tracker")', { timeout: 10000 });

      // Verify that the page title is correct
      const title = await page.textContent('h1');
      expect(title).toBe('Asset Tracker');

      // Verify that the asset table is displayed
      // Wait for table rows to be visible, which is more reliable than checking the table element itself
      // Retry mechanism for table rows
      let retries = 3;
      let rowCount = 0;
      while (retries > 0) {
        await page.waitForSelector('table', { state: 'visible', timeout: 10000 });
        rowCount = await page.locator('table tbody tr').count();
        if (rowCount > 0) break;
        await page.waitForTimeout(2000);
        retries--;
      }

      // If no rows found after retries, log the page content for debugging
      if (rowCount === 0) {
        const pageContent = await page.content();
        console.error('Page content when no rows found:', pageContent);
      }

      expect(rowCount).toBeGreaterThan(0);

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
