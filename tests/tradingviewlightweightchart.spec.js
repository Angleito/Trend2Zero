// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('TradingViewLightweightChart Component', () => {
  test('should render the chart correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test/tradingviewlightweightchart');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")');
    
    // Check if all chart containers are visible
    const chartContainers = await page.$$('.h-64');
    expect(chartContainers.length).toBe(4);
    
    // Wait for charts to load (they should replace loading spinners)
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    expect(canvasElements.length).toBeGreaterThan(0);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/tradingviewlightweightchart.png' });
  });
  
  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to the test page with an invalid symbol parameter to trigger an error
    await page.goto('/test/tradingviewlightweightchart?error=true');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")');
    
    // Check if error message appears (this is a mock test since we can't easily trigger a real error)
    // In a real scenario, you would need to mock the API response to return an error
    const errorText = await page.textContent('text=Failed to load chart data');
    if (errorText) {
      // If error message is found, check for retry button
      const retryButton = await page.$('button:has-text("Retry")');
      expect(retryButton).not.toBeNull();
    }
  });
});
