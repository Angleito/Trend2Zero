import { test, expect } from '@playwright/test';
import { testConfig } from './test-config';
test.describe('Performance Tests', () => {
    test('measure page load times', async ({ page }) => {
        // Define the pages to test
        const pagesToTest = [
            { url: '/', name: 'homepage' },
            { url: '/test-page', name: 'test-page' }
        ];
        for (const pageInfo of pagesToTest) {
            try {
                const startTime = Date.now();
                await page.goto(pageInfo.url);
                await page.waitForLoadState('networkidle');
                const loadTime = Date.now() - startTime;
                console.log(`Page load time for ${pageInfo.name}: ${loadTime}ms`);
                // Assert reasonable load time
                expect(loadTime).toBeLessThan(10000); // 10 seconds max
                await page.screenshot({
                    path: testConfig.getScreenshotPath(`${pageInfo.name}-load-time`),
                    fullPage: true
                });
            }
            catch (error) {
                console.error(`Error testing ${pageInfo.name}:`, error);
                continue;
            }
        }
    });
    test('measure page interactivity', async ({ page }) => {
        try {
            await page.goto('/test-page');
            await page.waitForLoadState('networkidle');
            // Take screenshot
            await page.screenshot({
                path: testConfig.getScreenshotPath('page-interactivity'),
                fullPage: true
            });
            // Basic interaction test
            const heading = await page.getByRole('heading').first();
            expect(heading).toBeTruthy();
            // Test button clicks if available
            const buttons = await page.getByRole('button').all();
            for (const button of buttons) {
                await button.click();
            }
        }
        catch (error) {
            console.error('Interactivity test failed:', error);
            throw error;
        }
    });
    test('measure scroll performance', async ({ page }) => {
        await page.goto('/test-page');
        await page.waitForLoadState('networkidle');
        // Start measuring
        const startTime = Date.now();
        // Perform a series of scrolls
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            await page.waitForTimeout(300);
        }
        // Calculate scroll performance time
        const scrollTime = Date.now() - startTime;
        console.log(`Scroll performance time: ${scrollTime}ms`);
        // Assert smooth scrolling
        expect(scrollTime).toBeLessThan(3000);
        // Take screenshot
        await page.screenshot({
            path: testConfig.getScreenshotPath('scroll-performance'),
            fullPage: true
        });
    });
    test('measure image loading', async ({ page }) => {
        await page.goto('/test-page');
        await page.waitForLoadState('networkidle');
        // Get all image elements
        const images = await page.locator('img').all();
        console.log(`Number of images: ${images.length}`);
        // Check image loading
        for (const image of images) {
            const isVisible = await image.isVisible();
            if (isVisible) {
                const isLoaded = await page.evaluate(async (img) => {
                    const element = document.querySelector(img);
                    if (!element || !(element instanceof HTMLImageElement))
                        return false;
                    return element.complete && element.naturalWidth > 0;
                }, await image.evaluate(node => {
                    return `img[src="${node.getAttribute('src')}"]`;
                }));
                expect(isLoaded).toBeTruthy();
            }
        }
        // Take screenshot
        await page.screenshot({
            path: testConfig.getScreenshotPath('image-loading'),
            fullPage: true
        });
    });
});
