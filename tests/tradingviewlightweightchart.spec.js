import { test, expect } from '@playwright/test';

test.describe('TradingViewLightweightChart Component', () => {
  test('should render the chart correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test/tradingviewlightweightchart');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")', { state: 'visible', timeout: 10000 });

    // Check if all chart containers are visible
    const chartContainers = await page.$$('.h-64');
    expect(chartContainers.length).toBe(4);

    // Wait for loading spinners to disappear
    await page.waitForSelector('[data-testid="chart-loading"]', { state: 'detached', timeout: 5000 }).catch(() => {
      console.log('No loading indicators found or they disappeared quickly');
    });

    // Wait longer for charts to render
    await page.waitForTimeout(5000);

    // Check if chart containers are present
    const chartElements = await page.$$('[data-testid="chart-container"]');
    console.log(`Number of chart containers found: ${chartElements.length}`);

    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    console.log(`Number of canvas elements found: ${canvasElements.length}`);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/tradingviewlightweightchart.png' });

    // Expect at least one chart container
    expect(chartElements.length).toBeGreaterThan(0);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to the test page with error mode
    await page.goto('/test/tradingviewlightweightchart?error=true');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")', { state: 'visible', timeout: 10000 });

    // Wait for error state to render
    await page.waitForTimeout(5000);

    // Check for error message using data-testid
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
    const errorMessage = page.getByTestId('error-message');

    // Check error message text
    const errorText = await errorMessage.textContent();
    expect(errorText).toBe('Failed to load chart data');

    // Check for retry button
    await page.waitForSelector('[data-testid="retry-button"]', { timeout: 10000 });
    const retryButton = page.getByTestId('retry-button');
    expect(retryButton).toBeTruthy();

    // Take a screenshot of the error state
    await page.screenshot({ path: 'test-results/tradingviewlightweightchart-error.png' });
  });

  test('TradingView Lightweight Chart renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/test-page');
    await expect(page.locator('.tv-lightweight-charts')).toBeVisible();
  });
});
