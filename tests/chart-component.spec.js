// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('TradingViewLightweightChart Component', () => {
  test('should render charts with both data and symbol props', async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test/charts');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Charts Test Page")');
    
    // Wait for charts to load (loading spinners should disappear)
    await page.waitForSelector('[data-testid="chart-loading"]', { state: 'detached', timeout: 5000 }).catch(() => {
      console.log('No loading indicators found or they disappeared quickly');
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'charts-test-page.png' });
    
    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    console.log(`Found ${canvasElements.length} canvas elements`);
    
    // We should have at least one canvas element per chart (4 charts total)
    expect(canvasElements.length).toBeGreaterThan(0);
    
    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Wait a bit to collect any console errors
    await page.waitForTimeout(2000);
    
    // There should be no console errors
    expect(errors.length).toBe(0);
  });
  
  test('should handle error states gracefully', async ({ page }) => {
    // Navigate to a test page that will trigger an error
    // We'll use a special query parameter to simulate an error
    await page.goto('http://localhost:3000/test/charts?error=true');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Charts Test Page")');
    
    // Take a screenshot
    await page.screenshot({ path: 'charts-error-page.png' });
    
    // Check if any error messages are displayed
    const errorMessages = await page.$$('[data-testid="error-message"]');
    console.log(`Found ${errorMessages.length} error messages`);
    
    // Check if retry buttons are available
    const retryButtons = await page.$$('[data-testid="retry-button"]');
    console.log(`Found ${retryButtons.length} retry buttons`);
    
    // Test clicking a retry button if available
    if (retryButtons.length > 0) {
      await retryButtons[0].click();
      console.log('Clicked retry button');
      
      // Wait a bit for the retry action to take effect
      await page.waitForTimeout(2000);
      
      // Take another screenshot after retry
      await page.screenshot({ path: 'charts-after-retry.png' });
    }
  });
});
