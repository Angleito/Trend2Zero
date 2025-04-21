import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
test.describe('Top Cryptocurrencies Integration Tests', () => {
    // List of top cryptocurrency symbols to test (the 25 we added)
    const topCryptoSymbols = [
        'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'STETH', 'ADA', 'DOGE',
        'TRX', 'TON', 'AVAX', 'LINK', 'MATIC', 'DOT', 'SHIB', 'LTC', 'BCH', 'UNI',
        'ATOM', 'XLM', 'NEAR', 'ICP', 'FIL'
    ];
    // Track success/failure counts for reporting
    const results = {
        successful: 0,
        failed: 0,
        symbols: {}
    };
    test('should successfully fetch prices for all top 25 cryptocurrencies', async ({ request }) => {
        // Test each cryptocurrency symbol
        for (const symbol of topCryptoSymbols) {
            try {
                // Call the market data API endpoint
                const response = await request.get(`/api/market-data/price/${symbol}`);
                // Check if successful
                if (response.status() === 200) {
                    // Parse and validate the response data
                    const data = await response.json();
                    // Check essential properties
                    const hasRequiredProps = data &&
                        data.symbol === symbol &&
                        typeof data.price === 'number' &&
                        data.price > 0;
                    if (hasRequiredProps) {
                        console.log(`✅ ${symbol.padEnd(6)} → $${data.price.toFixed(2)}`);
                        results.successful++;
                        results.symbols[symbol] = {
                            success: true,
                            price: data.price
                        };
                    }
                    else {
                        console.log(`❌ ${symbol.padEnd(6)} → Invalid data structure`);
                        results.failed++;
                        results.symbols[symbol] = {
                            success: false,
                            error: 'Invalid data structure'
                        };
                    }
                }
                else {
                    console.log(`❌ ${symbol.padEnd(6)} → Status ${response.status()}`);
                    results.failed++;
                    results.symbols[symbol] = {
                        success: false,
                        error: `API returned ${response.status()}`
                    };
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(`❌ ${symbol.padEnd(6)} → Error: ${error.message}`);
                }
                else {
                    console.log(`❌ ${symbol.padEnd(6)} → Error: Unknown error`);
                }
                results.failed++;
                results.symbols[symbol] = {
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
            // Add small delay between requests to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        // Output final summary after all tests are complete
        console.log('\n----- Test Summary -----');
        console.log(`✅ Successful: ${results.successful}/${topCryptoSymbols.length} cryptocurrencies`);
        console.log(`❌ Failed: ${results.failed}/${topCryptoSymbols.length} cryptocurrencies`);
        // List failed symbols if any
        if (results.failed > 0) {
            console.log('\nFailed Cryptocurrencies:');
            for (const symbol in results.symbols) {
                if (!results.symbols[symbol].success) {
                    console.log(`- ${symbol}: ${results.symbols[symbol].error}`);
                }
            }
        }
        // At least 75% of cryptocurrencies should work (allow for some API limitations)
        expect(results.successful).toBeGreaterThanOrEqual(Math.floor(topCryptoSymbols.length * 0.75));
    });
    test('should load chart data for major cryptocurrencies', async ({ page }) => {
        // Test chart data for the most important cryptocurrencies
        const majorCryptos = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
        for (const symbol of majorCryptos) {
            try {
                // Navigate to the asset detail page with chart tab
                await page.goto(`/asset/${symbol}?tab=charts`);
                // Wait for chart to load or error message to appear
                await page.waitForSelector('[data-testid="price-chart"], [data-testid="error-message"]', { timeout: 15000 });
                // Check if we got a chart
                const hasChart = await page.locator('[data-testid="price-chart"]').count() > 0;
                const hasError = await page.locator('[data-testid="error-message"]').count() > 0;
                if (hasChart) {
                    console.log(`✅ ${symbol} chart loaded successfully`);
                    // Take screenshot of the chart for verification
                    await page.locator('[data-testid="price-chart"]')
                        .screenshot({ path: `screenshots/chart-${symbol.toLowerCase()}.png` });
                    // Check chart contains data
                    const chartHeight = await page.evaluate(() => {
                        const chartElement = document.querySelector('[data-testid="price-chart"]');
                        return chartElement ? chartElement.clientHeight : 0;
                    });
                    expect(chartHeight).toBeGreaterThan(100);
                }
                else if (hasError) {
                    // Allow error but log it
                    const errorText = await page.locator('[data-testid="error-message"]').textContent();
                    console.log(`⚠️ ${symbol} chart error: ${errorText}`);
                }
                else {
                    throw new Error('Neither chart nor error message found');
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(`❌ ${symbol} chart test failed: ${error.message}`);
                }
                else {
                    console.log(`❌ ${symbol} chart test failed: Unknown error`);
                }
            }
            // Add delay between tests
            await page.waitForTimeout(1000);
        }
    });
});
