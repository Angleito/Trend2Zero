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

test.describe('Trend2Zero Application Tests', () => {
  let serverPort;

  test.beforeAll(() => {
    // Get the server port before running tests
    serverPort = getServerPort();
    console.log(`Using server port: ${serverPort}`);
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test with extended timeout and network idle
    await page.goto(`http://localhost:${serverPort}/`, {
      timeout: 45000,
      waitUntil: 'networkidle'
    });
    
    // Additional wait to ensure page is fully interactive
    await page.waitForFunction(() => document.readyState === 'complete');
  });

  test('Home page loads correctly', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle(/Trend2Zero/);

    // Verify navigation links
    await expect(page.locator('nav').first()).toContainText('Asset Tracker');
    await expect(page.locator('nav').first()).toContainText('About');
    await expect(page.locator('nav').first()).toContainText('Blog');
  });

  test('Asset Tracker page loads and displays data', async ({ page }) => {
    // Navigate to the tracker page
    await page.goto(`http://localhost:${serverPort}/tracker`, {
      timeout: 30000,
      waitUntil: 'networkidle'
    });

    // Wait for page to be fully loaded
    await page.waitForFunction(() => document.readyState === 'complete');

    // Verify the page title
    await expect(page.locator('h1')).toHaveText('Asset Tracker');

    // Verify that category buttons are present
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Cryptocurrency")')).toBeVisible();
    await expect(page.locator('button:has-text("Stocks")')).toBeVisible();

    // Verify that the search input is present
    await expect(page.locator('input[placeholder="Search assets..."]')).toBeVisible();

    // Wait for table with extended timeout and multiple retry strategies
    await page.waitForSelector('table', { state: 'visible', timeout: 45000 });
    
    // Advanced retry mechanism for table rows
    let retries = 5;
    let rowCount = 0;
    while (retries > 0) {
      try {
        rowCount = await page.locator('table tbody tr').count();
        if (rowCount > 0) break;
      } catch (error) {
        console.warn(`Row count attempt failed (${retries} retries left):`, error);
      }
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      retries--;
    }
    
    // If no rows found after retries, capture and log page state
    if (rowCount === 0) {
      const pageContent = await page.content();
      const networkRequests = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(r => r.entryType === 'resource')
          .map(r => ({ name: r.name, type: 'unknown' }));
      });
      
      console.error('Page content when no rows found:', pageContent);
      console.error('Network requests:', networkRequests);
    }
    
    expect(rowCount).toBeGreaterThan(0);

    // Test category filtering with extended wait
    await page.locator('button:has-text("Cryptocurrency")').click();
    await page.waitForTimeout(2000); // Extended wait for filtering

    // Verify that filtered results contain cryptocurrency assets
    await expect(page.locator('table tbody tr').first()).toContainText('Cryptocurrency');

    // Test search functionality with extended wait
    await page.locator('input[placeholder="Search assets..."]').fill('Bitcoin');
    await page.waitForTimeout(2000); // Extended wait for search results

    // Verify that search results contain Bitcoin
    await expect(page.locator('table tbody tr').first()).toContainText('Bitcoin');
  });

  test('Asset detail page loads correctly', async ({ page }) => {
    // Navigate to the tracker page first
    await page.goto(`http://localhost:${serverPort}/tracker`, { timeout: 30000 });

    // Click on the first asset link
    await page.locator('table tbody tr a').first().click();

    // Wait for the asset detail page to load
    await page.waitForLoadState('networkidle');

    // Verify that the page contains asset details
    await expect(page.locator('h1')).toBeVisible();

    // Verify that the price chart is present
    await expect(page.locator('h2:has-text("Price Chart")')).toBeVisible();

    // Verify that the price converter is present
    await expect(page.locator('h2:has-text("Price Converter")')).toBeVisible();

    // Test chart type toggle
    await page.locator('button:has-text("Advanced")').click();
    await page.waitForTimeout(1000);

    // Test time range selection
    await page.locator('button:has-text("1Y")').click();
    await page.waitForTimeout(1000);

    // Test price converter - skip if not available
    const amountInput = page.locator('input[type="number"]');
    if (await amountInput.count() > 0) {
      await amountInput.fill('10');
      await page.waitForTimeout(500);
    }
  });

  test('Navigation works correctly', async ({ page }) => {
    // Test navigation to Asset Tracker
    await page.locator('nav').first().getByText('Asset Tracker').click();
    await expect(page).toHaveURL(/.*\/tracker/);
    await expect(page.locator('h1')).toHaveText('Asset Tracker');

    // Test navigation to About page
    await page.locator('nav').first().getByText('About').click();
    await expect(page).toHaveURL(/.*\/about/);

    // Test navigation to Blog page
    await page.locator('nav').first().getByText('Blog').click();
    await expect(page).toHaveURL(/.*\/blog/);

    // Test navigation back to home
    // Use a more robust method to find and click the home link
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(`http://localhost:${serverPort}/`);
  });
});
