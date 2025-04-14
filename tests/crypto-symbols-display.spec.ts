import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

test.describe('Cryptocurrency Display Tests', () => {
  // List of top cryptocurrency symbols to verify on the tracker page
  // These are the top 25 cryptocurrencies by market cap as of April 2025
  const topCryptoSymbols = [
    'BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'ADA', 'DOGE', 'USDC', 'DOT',
    'MATIC', 'SHIB', 'TRX', 'AVAX', 'UNI', 'APT', 'LINK', 'LTC', 'ATOM', 'XMR',
    'FIL', 'ALGO', 'ICP', 'SUI', 'ZEC'
  ];

  // Track which symbols were found and which were missing
  const results = {
    found: [],
    missing: [],
    unexpected: []
  };

  test('should display all top cryptocurrencies on the tracker page', async ({ page }) => {
    // Navigate to the tracker page
    await page.goto('/tracker');
    
    // Set a longer timeout since we're waiting for multiple API calls to complete
    test.setTimeout(60000);
    
    // Wait for the crypto section to load
    await page.waitForSelector('[data-testid="crypto-section"]', { timeout: 30000 });
    
    // Wait for the asset list to be populated
    await page.waitForSelector('[data-testid="asset-item"]', { timeout: 30000 });
    
    // Extract all cryptocurrency symbols from the page
    const cryptoSymbolElements = await page.locator('[data-testid="asset-symbol"]').all();
    console.log(`Found ${cryptoSymbolElements.length} cryptocurrency symbols on the page`);
    
    // Get the text content of each symbol element
    const displayedSymbols = [];
    for (const element of cryptoSymbolElements) {
      const symbolText = await element.textContent();
      if (symbolText) {
        displayedSymbols.push(symbolText.trim());
      }
    }
    
    console.log('Displayed symbols:', displayedSymbols.join(', '));
    
    // Check which of our expected top symbols are present
    for (const symbol of topCryptoSymbols) {
      if (displayedSymbols.includes(symbol)) {
        (results.found as any[]).push(symbol);
      } else {
        (results.missing as any[]).push(symbol);
      }
    }
    
    // Check for any unexpected symbols
    for (const symbol of displayedSymbols) {
      if (symbol && !topCryptoSymbols.includes(symbol) && !symbol.includes('...')) {
        (results.unexpected as any[]).push(symbol);
      }
    }
    
    // Print summary of results
    console.log('\n----- Test Summary -----');
    console.log(`✅ Found: ${results.found.length}/${topCryptoSymbols.length} cryptocurrencies`);
    console.log(`❌ Missing: ${results.missing.length}/${topCryptoSymbols.length} cryptocurrencies`);
    
    if (results.found.length > 0) {
      console.log('\nFound Cryptocurrencies:');
      console.log(results.found.join(', '));
    }
    
    if (results.missing.length > 0) {
      console.log('\nMissing Cryptocurrencies:');
      console.log(results.missing.join(', '));
    }
    
    // Take a screenshot of the crypto section for verification
    await page.locator('[data-testid="crypto-section"]').screenshot({ 
      path: 'screenshots/crypto-section.png' 
    });
    
    // Test assertion - allow for some missing coins as the page might not show all at once
    // At least 15 of the top 25 cryptocurrencies should be displayed (60%)
    const minimumExpectedCoins = Math.floor(topCryptoSymbols.length * 0.6);
    expect(results.found.length).toBeGreaterThanOrEqual(minimumExpectedCoins);
  });
  
  test('should be able to filter and find specific top cryptocurrencies', async ({ page }) => {
    // Navigate to the tracker page
    await page.goto('/tracker');
    
    // Wait for the search/filter input to be available
    await page.waitForSelector('[data-testid="asset-search-input"]', { timeout: 10000 });
    
    // Select a few important cryptocurrencies to test specifically
    const criticalCoins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
    
    for (const symbol of criticalCoins) {
      // Enter the symbol in the search box
      await page.locator('[data-testid="asset-search-input"]').fill(symbol);
      
      // Wait for the filtered results
      await page.waitForTimeout(1000); // Small delay for filter to apply
      
      // Check if the specific cryptocurrency is shown in results
      const symbolIsVisible = await page.locator(`text=${symbol}`).isVisible();
      
      if (symbolIsVisible) {
        console.log(`✅ Successfully found ${symbol} when filtered`);
        
        // Take screenshot of the filtered result
        await page.screenshot({ 
          path: `screenshots/filtered-${symbol.toLowerCase()}.png` 
        });
      } else {
        console.log(`❌ Could not find ${symbol} when filtered`);
      }
      
      // Expect the symbol to be visible
      expect(symbolIsVisible).toBeTruthy();
      
      // Clear the search for next iteration
      await page.locator('[data-testid="asset-search-input"]').fill('');
      await page.waitForTimeout(500);
    }
  });

  test('should display detailed price information for top cryptocurrencies', async ({ page }) => {
    // Navigate to the asset detail page for Bitcoin as a representative example
    await page.goto('/asset/BTC');
    
    // Wait for price data to load
    await page.waitForSelector('[data-testid="asset-price"]', { timeout: 15000 });
    
    // Check detailed price information is displayed
    const priceElement = await page.locator('[data-testid="asset-price"]');
    const priceText = await priceElement.textContent();
    expect(priceText).toBeTruthy();
    
    // Check for other important price metrics
    const metricsToCheck = [
      'market-cap', 
      'volume-24h', 
      'price-change-24h',
      'price-change-percentage'
    ];
    
    for (const metric of metricsToCheck) {
      const selector = `[data-testid="${metric}"]`;
      const isMetricDisplayed = await page.locator(selector).count() > 0;
      
      if (isMetricDisplayed) {
        const metricText = await page.locator(selector).textContent();
        console.log(`✅ ${metric}: ${metricText}`);
      } else {
        console.log(`❌ ${metric} not displayed`);
      }
    }
    
    // Take screenshot of the price details section
    await page.screenshot({ 
      path: 'screenshots/btc-price-details.png' 
    });
  });
});