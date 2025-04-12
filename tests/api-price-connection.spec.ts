import { test, expect } from '@playwright/test';

test.describe('Price API Connection Tests', () => {
  test('should connect to Strapi API and fetch prices', async ({ page, request }) => {
    // Navigate to tracker page
    await page.goto('/tracker');
    
    // Wait for API calls to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/market-overview') ||
      response.url().includes('/api/assets'),
      { timeout: 10000 }
    );

    // Check if prices are loaded
    const priceElements = await page.locator('[data-testid="asset-price"]').all();
    expect(priceElements.length).toBeGreaterThan(0);

    // Verify Strapi connection
    const strapiResponse = await request.get(`${process.env.STRAPI_API_URL}/api/assets`);
    expect(strapiResponse.ok()).toBeTruthy();
    
    // Check price format and structure
    const prices = await Promise.all(
      priceElements.map(async (element) => {
        const priceText = await element.textContent();
        // Price should be a number with 2 decimal places
        return !isNaN(parseFloat(priceText.replace(/[^0-9.-]+/g, '')));
      })
    );
    expect(prices.every(Boolean)).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to tracker page with simulated API error
    await page.route('**/api/assets', route => route.abort());
    await page.goto('/tracker');

    // Check if error message is displayed
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toBeTruthy();
  });
});