import { test, expect } from '@playwright/test';
import { testConfig } from './test-config';
test.describe('Home Page', () => {
    test.beforeEach(async () => {
        // Ensure test directories exist
        testConfig.ensureDirs();
    });
    test('should load home page successfully', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Trend2Zero/);
        // Take screenshot for visual comparison
        await page.screenshot({
            path: testConfig.getScreenshotPath('home-page'),
            fullPage: true
        });
    });
    test('should handle error states gracefully', async ({ page }) => {
        // Simulate offline state
        await page.route('**/*', (route) => route.abort());
        await page.goto('/');
        // Check error handling
        const errorElement = page.getByRole('alert');
        await expect(errorElement).toBeVisible();
        await page.screenshot({
            path: testConfig.getScreenshotPath('home-page-error'),
            fullPage: true
        });
    });
});
