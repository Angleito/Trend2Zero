// @ts-check
/**
 * IMPORTANT: This project uses Playwright exclusively for browser testing and debugging.
 * Do not use manual browser testing or other testing frameworks.
 * All browser-related components should be tested using this approach.
 */
const { test, expect } = require('@playwright/test');

test('diagnose browser issues', async ({ page }) => {
  // Navigate to the tracker page
  await page.goto('http://localhost:3001/tracker');

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Asset Tracker")');

  // Take a screenshot
  await page.screenshot({ path: 'tracker-page.png' });

  // Check console logs
  page.on('console', msg => {
    console.log(`Browser console ${msg.type()}: ${msg.text()}`);
  });

  // Check for network errors
  page.on('response', response => {
    if (!response.ok() && !response.url().includes('favicon.ico')) {
      console.log(`Network error: ${response.status()} for ${response.url()}`);
    }
  });

  // Test the search functionality
  const searchInput = page.locator('input[placeholder="Search assets..."]');
  await searchInput.fill('bitcoin');
  await page.waitForTimeout(1000); // Wait for search results

  // Take a screenshot of search results
  await page.screenshot({ path: 'search-results.png' });

  // Test category selection
  await page.locator('button:has-text("Cryptocurrency")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'crypto-category.png' });

  // Navigate to an asset detail page
  await page.locator('a:has-text("Bitcoin")').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'asset-detail.png' });

  // Test the chart functionality
  await page.locator('button:has-text("Advanced")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'advanced-chart.png' });

  // Test the time range selection
  await page.locator('button:has-text("1Y")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'one-year-chart.png' });

  // Test the price converter
  const amountInput = page.locator('input[type="number"]');
  await amountInput.fill('10');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'price-converter.png' });
});
