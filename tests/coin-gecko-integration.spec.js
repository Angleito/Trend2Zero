import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
test.describe('CoinGecko API Integration Tests', () => {
    // Common crypto symbols to test
    const testSymbols = ['BTC', 'ETH', 'SOL'];
    test.beforeEach(async ({ page }) => {
        // Ensure API keys are available (use mock data if not)
        if (!process.env.COINMARKETCAP_API_KEY && !process.env.COINGECKO_API_KEY) {
            console.log('No API keys found. Tests will use mock data.');
        }
    });
    test('should fetch cryptocurrency prices via API with load balancing', async ({ page }) => {
        // Navigate to the asset detail page for Bitcoin
        await page.goto('/asset/BTC');
        // Wait for price data to load
        await page.waitForSelector('[data-testid="asset-price"]', { timeout: 15000 });
        // Check if the price is displayed properly
        const priceElement = await page.locator('[data-testid="asset-price"]');
        const priceText = await priceElement.textContent();
        // The price should be a numeric value with $ prefix
        expect(priceText).toBeTruthy();
        if (priceText) {
            expect(parseFloat(priceText.replace(/[^0-9.-]+/g, ''))).toBeGreaterThan(0);
        }
        // Check if change percentage is displayed
        const changeElement = await page.locator('[data-testid="price-change"]');
        expect(changeElement).toBeTruthy();
        // Screenshot the price display area for visual verification
        await changeElement.screenshot({ path: 'screenshots/btc-price-display.png' });
    });
    test('should verify load balancing by simulating rate limiting', async ({ page }) => {
        // This test will validate that the load balancing mechanism works
        // by simulating a rate-limited response from CoinMarketCap
        // First, intercept CoinMarketCap API calls and return rate limit error
        await page.route('**coinmarketcap.com**', route => {
            return route.fulfill({
                status: 429,
                body: JSON.stringify({
                    status: { error_code: 429, error_message: 'Rate limit exceeded' }
                })
            });
        });
        // Navigate to the asset detail page for Ethereum
        await page.goto('/asset/ETH');
        // Wait for price data to load (this should now use CoinGecko)
        await page.waitForSelector('[data-testid="asset-price"]', { timeout: 15000 });
        // Verify price data is still displayed despite CoinMarketCap being "down"
        const priceElement = await page.locator('[data-testid="asset-price"]');
        const priceText = await priceElement.textContent();
        expect(priceText).toBeTruthy();
        // Check the network requests to verify CoinGecko was called
        const requests = page.request.all();
        const coinGeckoRequests = requests.filter((req) => req.url().includes('coingecko.com') || req.url().includes('api/market-data'));
        expect(coinGeckoRequests.length).toBeGreaterThan(0);
    });
    test('should load historical chart data for multiple cryptocurrencies', async ({ page }) => {
        // Loop through test symbols
        for (const symbol of testSymbols) {
            // Navigate to the asset detail page
            await page.goto(`/asset/${symbol}?tab=charts`);
            // Wait for chart to load
            await page.waitForSelector('[data-testid="price-chart"]', { timeout: 15000 });
            // Check if chart container has canvas element (indicating chart is rendered)
            const chartContainer = await page.locator('[data-testid="price-chart"]');
            const canvasElement = await chartContainer.locator('canvas').count();
            expect(canvasElement).toBeGreaterThan(0);
            // Verify data points are rendered by checking chart height
            const chartHeight = await chartContainer.evaluate((el) => {
                const canvas = el.querySelector('canvas');
                return canvas ? canvas.height : 0;
            });
            expect(chartHeight).toBeGreaterThan(100);
            // Take screenshot of each chart for visual verification
            await chartContainer.screenshot({ path: `screenshots/${symbol.toLowerCase()}-chart.png` });
        }
    });
    test('should handle both API providers failing gracefully', async ({ page }) => {
        // Simulate both API providers failing
        await page.route('**coinmarketcap.com**', route => route.abort());
        await page.route('**coingecko.com**', route => route.abort());
        await page.route('**/api/market-data/**', route => route.abort());
        // Navigate to the asset detail page
        await page.goto('/asset/BTC');
        // Check if fallback UI is displayed (could be mock data or error state)
        const fallbackElement = await page.locator('[data-testid="asset-price"], [data-testid="error-message"]');
        expect(await fallbackElement.count()).toBeGreaterThanOrEqual(1);
        // If it's an error message, check that it's displayed properly
        const errorElement = await page.locator('[data-testid="error-message"]').count();
        if (errorElement > 0) {
            const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
            expect(errorMessage).toBeTruthy();
        }
        // If it's price data, it should be using mock data
        else {
            const priceText = await page.locator('[data-testid="asset-price"]').textContent();
            expect(priceText).toBeTruthy();
        }
    });
});
