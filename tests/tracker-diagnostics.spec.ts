import { test, expect } from '@playwright/test';

test('Diagnose Tracker Page Issues', async ({ page }) => {
  // Enable detailed logging
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  // Track network requests
  const requests: string[] = [];
  const failedRequests: {url: string, status: number | string}[] = [];

  page.on('request', request => {
    requests.push(request.url());
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      failedRequests.push({url, status});
      console.log(`Failed request: ${url} (${status})`);
    }
  });

  // Navigate to the tracker page
  console.log('Navigating to tracker page...');
  await page.goto('http://localhost:3000/tracker', { timeout: 10000 });

  // Wait for any content to load
  await page.waitForLoadState('domcontentloaded');
  console.log('Page DOM content loaded');

  // Take a screenshot immediately after load
  await page.screenshot({ path: 'test-results/tracker-initial-load.png', fullPage: true });

  // Try to find the heading
  try {
    await page.waitForSelector('h1', { timeout: 5000 });
    const heading = await page.locator('h1').textContent();
    console.log(`Found heading: ${heading}`);
  } catch (e) {
    console.log('Could not find h1 element');
  }

  // Wait for the market data API call
  try {
    await page.waitForResponse(response =>
      response.url().includes('/api/market-data') &&
      response.status() === 200,
      { timeout: 3000 }
    );
    console.log('Market data API call completed successfully');
  } catch (e) {
    console.log('Market data API call timed out or failed');
  }

  // Wait for the bitcoin price API call
  try {
    await page.waitForResponse(response =>
      response.url().includes('/api/crypto/bitcoin-price') &&
      response.status() === 200,
      { timeout: 3000 }
    );
    console.log('Bitcoin price API call completed successfully');
  } catch (e) {
    console.log('Bitcoin price API call timed out or failed');
  }

  // Wait a bit to capture API calls
  await page.waitForTimeout(2000);

  // Check if the loading spinner is still visible
  const isLoading = await page.locator('.animate-spin').isVisible();
  console.log(`Is loading spinner visible: ${isLoading}`);

  // Check for error messages
  const errorMessages = await page.locator('text=error').allTextContents();
  if (errorMessages.length > 0) {
    console.log('Error messages found:', errorMessages);
  }

  // Check if the table is visible
  const isTableVisible = await page.locator('table').isVisible();
  console.log(`Is table visible: ${isTableVisible}`);

  // If the table is visible, check if it has rows
  if (isTableVisible) {
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Table has ${rowCount} rows`);
  }

  // Log all API calls
  const apiCalls = requests.filter(url => url.includes('/api/'));
  console.log('API calls made:', apiCalls);

  // Log failed requests
  console.log('Failed requests:', failedRequests);

  // Evaluate page state
  const pageState = await page.evaluate(() => {
    return {
      documentTitle: document.title,
      bodyContent: document.body.textContent,
      hasTable: !!document.querySelector('table'),
      hasErrorMessage: !!document.querySelector('.text-red-500'),
      visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.textContent?.trim();
      }).length
    };
  });

  console.log('Page state:', pageState);

  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'test-results/tracker-diagnostics.png', fullPage: true });

  // Basic assertions to ensure the page loaded
  expect(pageState.hasTable || isLoading).toBeTruthy();
});
