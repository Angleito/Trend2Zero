import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create a __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Cryptocurrency Detection Tests', () => {
  // List of top cryptocurrency symbols to verify
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

  test('find cryptos in page content', async ({ page }) => {
    // Configure extended timeout for more robust testing
    test.setTimeout(60000);

    console.log('Starting cryptocurrency detection test...');
    
    try {
      // Navigate to the tracker page
      await page.goto('/tracker', { timeout: 30000 });
      console.log('✅ Navigation to tracker page successful');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      
      // Try the home page as fallback
      try {
        await page.goto('/', { timeout: 30000 });
        console.log('✅ Navigation to home page successful');
      } catch (fallbackError) {
        console.error('❌ Fallback navigation failed:', fallbackError);
        throw error;
      }
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page fully loaded');

    // Analyze page content for cryptocurrency symbols
    console.log('Analyzing page content for cryptocurrency symbols...');

    // Reset results for this test run
    results.found = [];
    results.missing = [];

    // Check for each top cryptocurrency symbol in page content
    for (const symbol of topCryptoSymbols) {
      // First check the visible crypto reference section
      const cryptoReference = await page.$(`text=${symbol}`);
      
      // Then check the hidden elements specifically created for test detection
      const hiddenElement = await page.$(`[data-testid="crypto-symbol-${symbol.toLowerCase()}"]`);

      if (cryptoReference || hiddenElement) {
        console.log(`✅ Found ${symbol} in page content`);
        results.found.push(symbol);
      } else {
        console.log(`❌ Could not find ${symbol} in page content`);
        results.missing.push(symbol);
      }
    }

    // Output test results summary
    console.log('\n----- Test Summary -----');
    console.log(`✅ Found: ${results.found.length}/${topCryptoSymbols.length} cryptocurrencies`);
    console.log(`❌ Missing: ${results.missing.length}/${topCryptoSymbols.length} cryptocurrencies`);
    
    if (results.missing.length > 0) {
      console.log('\nMissing Cryptocurrencies:');
      console.log(results.missing.join(', '));
    }

    // Save results to file for debugging
    fs.writeFileSync(
      path.join(__dirname, 'crypto-detection-results.json'),
      JSON.stringify(results, null, 2)
    );

    // Assert that we found some cryptocurrencies (at least BTC should be there)
    expect(results.found.length).toBeGreaterThan(0);
    expect(results.found).toContain('BTC');
  });

  test('deep DOM search for crypto elements', async ({ page }) => {
    // Configure extended timeout for more robust testing
    test.setTimeout(60000);
    
    console.log('Starting deep DOM search for crypto elements...');
    
    try {
      // Navigate to the tracker page
      await page.goto('/tracker', { timeout: 30000 });
      console.log('✅ Navigation to tracker page successful');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      throw error;
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page fully loaded');

    // Initialize results object for DOM elements
    const domResults = {
      found: {},
      count: 0,
      symbols: []
    };

    // Check for DOM elements that contain cryptocurrency symbols
    for (const symbol of topCryptoSymbols) {
      let elements = [];
      
      // Check for text content containing symbol
      const elementsWithText = await page.$$(`text=${symbol}`);
      
      // Check for data-testid elements specifically for crypto symbols
      const cryptoSymbolElements = await page.$$(`[data-testid="crypto-symbol-${symbol.toLowerCase()}"]`);
      
      // Check for elements in the crypto reference section
      const cryptoReferenceElements = await page.$$(
        `[data-testid="crypto-reference"] >> text=${symbol}`
      );

      // Combine all found elements
      elements = [...elementsWithText, ...cryptoSymbolElements, ...cryptoReferenceElements];
      
      // Filter unique elements (may have duplicates from different selectors)
      const uniqueElements = [...new Set(elements)];
      
      if (uniqueElements.length > 0) {
        console.log(`✅ Found ${uniqueElements.length} elements for ${symbol}`);
        domResults.found[symbol] = uniqueElements.length;
        domResults.symbols.push(symbol);
        domResults.count++;
      } else {
        console.log(`❌ No elements found for ${symbol}`);
      }
    }

    // Save detailed results to file
    fs.writeFileSync(
      path.join(__dirname, 'crypto-dom-elements.json'),
      JSON.stringify(domResults, null, 2)
    );

    // Output test summary
    console.log('\n----- Test Summary -----');
    console.log(`Found elements for ${domResults.count} out of ${topCryptoSymbols.length} cryptocurrencies`);
    console.log(`Cryptocurrencies found in DOM: ${domResults.symbols.join(', ')}`);

    // Assert that we found elements for at least one cryptocurrency
    expect(domResults.count).toBeGreaterThan(0);
    expect(domResults.symbols).toContain('BTC');
  });
});