import { test, expect } from '@playwright/test';

test.describe('Price API Connection Tests', () => {
  test('should connect to Strapi API and fetch prices', async ({ page, request }) => {
    // Navigate to tracker page
    await page.goto('/tracker');
    
    // Wait for API calls to complete with extended timeout
    const responses = await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/market-overview') ||
        response.url().includes('/api/assets'),
        { timeout: 30000 }
      ),
      page.waitForResponse(response =>
        response.url().includes('/api/market-overview') ||
        response.url().includes('/api/assets'),
        { timeout: 30000 }
      )
    ]);

    // Log response details for debugging
    for (const response of responses) {
      console.log(`Response URL: ${response.url()}, Status: ${response.status()}`);
    }

    // Check if prices are loaded
    const priceElements = await page.locator('[data-testid="asset-price"]').all();
    expect(priceElements.length).toBeGreaterThan(0);

    // Verify Strapi connection with more detailed error handling
    const strapiResponse = await request.get(`${process.env.STRAPI_API_URL}/api/assets`);
    expect(strapiResponse.ok()).toBeTruthy();
    
    // Check price format and structure with more robust validation
    const prices = await Promise.all(
      priceElements.map(async (element) => {
        const priceText = await element.textContent() ?? '';
        const cleanPrice = priceText.replace(/[^0-9.-]+/g, '');
        const parsedPrice = parseFloat(cleanPrice);
        return {
          valid: !isNaN(parsedPrice) && cleanPrice !== '',
          price: parsedPrice,
          originalText: priceText
        };
      })
    );

    // More detailed price validation
    const invalidPrices = prices.filter(p => !p.valid);
    expect(invalidPrices.length).toBe(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to tracker page with simulated API error
    await page.route('**/api/assets', route => route.abort());
    await page.goto('/tracker');

    // Wait for error state to render
    await page.waitForSelector('[data-testid="error-message"]', { state: 'visible', timeout: 10000 });

    // Check if error message is displayed
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toBeTruthy();

    // Check for retry button
    const retryButton = await page.locator('[data-testid="retry-button"]');
    expect(await retryButton.isVisible()).toBeTruthy();
  });
});