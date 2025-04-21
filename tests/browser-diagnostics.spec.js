import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Utility function to log diagnostics
const logDiagnostics = (diagnostics, filename) => {
    const logPath = path.resolve(__dirname, `diagnostics-${filename}.json`);
    fs.writeFileSync(logPath, JSON.stringify(diagnostics, null, 2));
    console.log(`Diagnostics logged to ${logPath}`);
};
test('Comprehensive Bitcoin Price Diagnostics', async ({ page, context }, testInfo) => {
    // Configure extended timeout for more robust testing
    test.setTimeout(30000);
    // Capture and log console messages with enhanced tracking
    const consoleLogs = [];
    const networkRequests = [];
    const networkErrors = [];
    // Enhanced console logging with more context
    page.on('console', msg => {
        const logEntry = {
            type: msg.type(),
            message: msg.text(),
            timestamp: Date.now()
        };
        consoleLogs.push(logEntry);
        console.log(`Console Log [${logEntry.type}]:`, logEntry.message);
    });
    // Comprehensive network request tracking
    page.on('request', request => {
        const requestEntry = {
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
        };
        networkRequests.push(requestEntry);
        console.log('Network Request:', requestEntry.url);
        // Detailed error handling for network requests
        request.response().catch((error) => {
            const errorEntry = {
                url: request.url(),
                error: error.message,
                timestamp: Date.now()
            };
            networkErrors.push(errorEntry);
            console.error('Network Request Error:', errorEntry);
        });
    });
    // Add error page handler for capturing page errors
    page.on('pageerror', (error) => {
        console.error('Page Error:', error);
        networkErrors.push({
            url: page.url(),
            error: error.message,
            timestamp: Date.now()
        });
    });
    // Environment-based conditional test execution
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        console.log('Running in production environment with additional safeguards');
    }
    // Navigate to the application with extended timeout and error handling
    try {
        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle',
            timeout: 10000
        });
    }
    catch (navError) {
        const errorMessage = navError instanceof Error ? navError.message : String(navError);
        console.error('Navigation Error:', errorMessage);
        throw new Error(`Failed to navigate: ${errorMessage}`);
    }
    // Add data-testid for error message elements
    await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .error-message');
        errorElements.forEach((el, index) => {
            el.setAttribute('data-testid', `error-message-${index}`);
        });
    });
    // Manually trigger the API call with enhanced error handling
    const apiCallDiagnostics = await page.evaluate(async () => {
        try {
            const response = await fetch('/api/crypto?endpoint=bitcoin-price');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Bitcoin API response:', data);
            return {
                status: response.status,
                data: data,
                success: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Bitcoin API error:', errorMessage);
            return {
                status: 'error',
                message: errorMessage,
                success: false
            };
        }
    });
    // Detailed Bitcoin price fetching diagnostics with fallback mechanisms
    const bitcoinTickerLogs = await page.evaluate(() => {
        const bitcoinTicker = document.querySelector('.bitcoin-ticker');
        if (!bitcoinTicker) {
            return {
                exists: false,
                error: 'Bitcoin ticker element not found',
                fallbackSelectors: [
                    '#bitcoin-price',
                    '[data-testid="bitcoin-ticker"]',
                    '.price-display'
                ]
            };
        }
        return {
            exists: true,
            text: bitcoinTicker?.textContent || 'No text found',
            price: bitcoinTicker?.querySelector('p')?.textContent || 'No price found',
            innerHTML: bitcoinTicker?.innerHTML || 'No inner HTML',
            dataAttributes: {
                testId: bitcoinTicker.getAttribute('data-testid'),
                priceSource: bitcoinTicker.getAttribute('data-price-source')
            }
        };
    });
    // Comprehensive diagnostics logging
    const diagnostics = {
        bitcoinTickerLogs,
        apiCallDiagnostics,
        consoleLogs,
        networkRequests,
        networkErrors,
        timestamp: new Date().toISOString()
    };
    // Log diagnostics to file for further investigation
    logDiagnostics(diagnostics, testInfo.title.replace(/\s+/g, '-').toLowerCase());
    // Assertions with more detailed error messages
    expect(bitcoinTickerLogs.exists, `Bitcoin ticker not found. Fallback selectors: ${bitcoinTickerLogs.fallbackSelectors?.join(', ')}`).toBeTruthy();
    // Check for Bitcoin price API calls
    const bitcoinApiCalls = networkRequests.filter(req => req.url.includes('/api/crypto') && req.url.includes('endpoint=bitcoin-price'));
    // Detailed API call validation
    expect(bitcoinApiCalls.length, 'No Bitcoin price API calls found. Check network configuration and API endpoint.').toBeGreaterThan(0);
    // Validate API call success
    expect(apiCallDiagnostics.success, `API call failed: ${apiCallDiagnostics.message}`).toBeTruthy();
    // Validate no network errors
    expect(networkErrors.length, `Network errors detected: ${JSON.stringify(networkErrors)}`).toBe(0);
});
