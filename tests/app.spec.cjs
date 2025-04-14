const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  try {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();

    await page.screenshot({ path: 'test-results/screenshots/homepage-load.png' });

    // Check page title
    const pageTitle = await page.title();
    
    // Validate key elements
    const mainHeading = await page.getByRole('heading', { name: /trend2zero/i });
    expect(mainHeading).toBeTruthy();

    // Check for critical UI components
    const navigationLinks = await page.getByRole('navigation').getByRole('link').all();
    expect(navigationLinks.length).toBeGreaterThan(0);
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
});