import { test, expect } from '@playwright/test';
test.describe('Strapi Admin Panel Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Configure longer timeout for admin panel operations
        await page.setDefaultTimeout(30000);
    });
    test('should access admin panel and verify content types', async ({ page }) => {
        // Navigate to admin panel
        await page.goto('http://localhost:1337/admin');
        // Wait for login form to be visible
        await page.waitForSelector('input[name="email"]');
        await page.waitForSelector('input[name="password"]');
        // Fill login credentials
        await page.fill('input[name="email"]', process.env.STRAPI_ADMIN_EMAIL || '');
        await page.fill('input[name="password"]', process.env.STRAPI_ADMIN_PASSWORD || '');
        // Click login button and wait for navigation
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);
        // Verify we can access content manager
        await page.click('a[href="/admin/content-manager"]');
        // Check for our content types
        await expect(page.locator('text=Asset')).toBeVisible();
        await expect(page.locator('text=Historical Data')).toBeVisible();
        // Take a screenshot of the content manager
        await page.screenshot({ path: 'strapi-content-manager.png' });
    });
    test('should verify API endpoints are responding', async ({ request }) => {
        // Test asset endpoint
        const assetResponse = await request.get('http://localhost:1337/api/assets');
        expect(assetResponse.ok()).toBeTruthy();
        // Test historical data endpoint
        const historicalResponse = await request.get('http://localhost:1337/api/historical-data-entries');
        expect(historicalResponse.ok()).toBeTruthy();
    });
});
