import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
test.describe('API Load Balancing Tests', () => {
    // Test symbols representing different types of assets
    const testSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
    test.beforeEach(async ({ context }) => {
        // Set default timeout for API requests
        context.setDefaultTimeout(30000);
    });
    test('should successfully fetch price data for multiple cryptocurrencies', async ({ request }) => {
        // Test each cryptocurrency symbol
        for (const symbol of testSymbols) {
            // Call the market data API endpoint
            const response = await request.get(`/api/market-data/price/${symbol}`);
            // Verify successful response
            expect(response.status()).toBe(200);
            // Parse and validate the response data
            const data = await response.json();
            expect(data).toHaveProperty('symbol', symbol);
            expect(data).toHaveProperty('price');
            expect(typeof data.price).toBe('number');
            expect(data.price).toBeGreaterThan(0);
            // Verify required fields are present
            expect(data).toHaveProperty('lastUpdated');
            expect(data).toHaveProperty('priceInUSD');
            console.log(`✅ ${symbol} price data verified: $${data.price}`);
        }
    });
    test('should fetch historical data with the correct structure', async ({ request }) => {
        // Parameters for historical data request
        const days = 7;
        const symbol = 'BTC';
        // Call the historical data API endpoint
        const response = await request.get(`/api/market-data/historical/${symbol}?days=${days}`);
        // Verify successful response
        expect(response.status()).toBe(200);
        // Parse and validate the response data
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        // Check structure of first data point
        const firstPoint = data[0];
        expect(firstPoint).toHaveProperty('date');
        expect(firstPoint).toHaveProperty('price');
        expect(firstPoint).toHaveProperty('volume');
        // Check if we have the expected number of days worth of data
        // (Allow some flexibility as API might return slightly more/less data points)
        const uniqueDays = new Set(data.map((point) => new Date(point.date).toISOString().split('T')[0])).size;
        expect(uniqueDays).toBeGreaterThanOrEqual(Math.min(5, days));
        console.log(`✅ Historical data verified: ${data.length} data points over ~${uniqueDays} days`);
    });
    test('should use load balancing when handling multiple requests', async ({ request }) => {
        // Make multiple simultaneous requests to trigger load balancing
        const promises = testSymbols.map(symbol => request.get(`/api/market-data/price/${symbol}`));
        // Wait for all requests to complete
        const responses = await Promise.all(promises);
        // Verify all requests succeeded
        responses.forEach((response, index) => {
            expect(response.status()).toBe(200);
            console.log(`✅ Request ${index + 1}/${responses.length} successful`);
        });
        // At least one request should succeed
        expect(responses.some(r => r.status() === 200)).toBe(true);
    });
    test('should fetch market overview data with proper structure', async ({ request }) => {
        // Call the market overview API endpoint
        const response = await request.get('/api/market-data/overview');
        // Verify successful response
        expect(response.status()).toBe(200);
        // Parse and validate the response data
        const data = await response.json();
        // Check expected structure
        expect(data).toHaveProperty('totalMarketCap');
        expect(data).toHaveProperty('total24hVolume');
        expect(data).toHaveProperty('btcDominance');
        // Verify numeric values
        expect(typeof data.totalMarketCap).toBe('number');
        expect(typeof data.total24hVolume).toBe('number');
        expect(typeof data.btcDominance).toBe('number');
        // BTC dominance should be between 0-100%
        expect(data.btcDominance).toBeGreaterThan(0);
        expect(data.btcDominance).toBeLessThan(100);
        console.log(`✅ Market overview data verified: $${(data.totalMarketCap / 1e12).toFixed(2)}T market cap`);
    });
    test('should demonstrate rate limit handling', async ({ request }) => {
        // Make a large number of sequential requests to potentially trigger rate limiting
        const numRequests = 10;
        let rateLimitDetected = false;
        for (let i = 0; i < numRequests; i++) {
            // Randomize symbol to spread requests across different endpoints
            const randomIndex = Math.floor(Math.random() * testSymbols.length);
            const symbol = testSymbols[randomIndex];
            // Make request with minimal delay between requests
            const response = await request.get(`/api/market-data/price/${symbol}`);
            if (response.status() === 429) {
                rateLimitDetected = true;
                console.log(`⚠️ Rate limit detected on request ${i + 1}`);
                // Break early if we've detected rate limiting
                break;
            }
            else {
                expect(response.status()).toBe(200);
            }
            // Add a short delay between requests to prevent overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        // If we did hit rate limits, the system should still work
        // and not completely fail - test this by making one more request
        if (rateLimitDetected) {
            // Wait a moment for the rate limiter to potentially switch providers
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Try a new request to see if the system switched providers
            const finalResponse = await request.get(`/api/market-data/price/BTC`);
            expect(finalResponse.status()).toBe(200);
            console.log('✅ System recovered after rate limiting');
        }
        else {
            console.log('✅ No rate limits hit during testing');
        }
    });
});
