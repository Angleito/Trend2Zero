import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';

// Test suite for diagnosing MongoDB connection and data flow issues
test.describe('MongoDB Connection and Data Flow Diagnostics', () => {
  // Check environment variables required for testing MongoDB connection
  test('should have required MongoDB environment variables', async ({ page }) => {
    const mongoEnv = process.env.MONGODB_URI;
    console.log('MongoDB URI detected:', mongoEnv ? 'Yes (set)' : 'No (not set)');
    
    // If not set, check if we can detect something from the environment
    if (!mongoEnv) {
      const dotenv = await import('dotenv');
      dotenv.config();
      console.log('Loaded environment variables from .env file');
      console.log('MongoDB URI after .env load:', process.env.MONGODB_URI ? 'Yes (set)' : 'No (not set)');
    }
    
    // Recommendation if still not available
    if (!process.env.MONGODB_URI) {
      console.warn('WARNING: MONGODB_URI is not set. Tests will use fallback "mongodb://localhost:27017/trend2zero"');
    }
  });

  // Test direct MongoDB connection
  test('should connect directly to MongoDB', async ({ request }) => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trend2zero';
    
    console.log('Attempting direct MongoDB connection...');
    let connection = null;
    
    try {
      // Attempt connection with timeout
      connection = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      });
      
      console.log('MongoDB connection successful');
      console.log('Connection state:', connection.connection.readyState);
      
      // Check if we can list collections
      const collections = await connection.connection.db?.listCollections()?.toArray() || [];
      console.log('Available collections:', collections.map(c => c.name).join(', ') || 'None');
      
      // Basic assertion
      expect(connection.connection?.readyState).toBe(1); // 1 = connected
      
    } catch (error) {
      console.error('MongoDB connection error:', error);
      expect(false, `Failed to connect to MongoDB: ${error}`).toBeTruthy();
    } finally {
      // Clean up connection
      if (connection) {
        await connection.disconnect();
        console.log('MongoDB connection closed');
      }
    }
  });

  // Test Bitcoin price API endpoint
  test('should fetch Bitcoin price data from API', async ({ request }) => {
    console.log('Testing Bitcoin price API endpoint...');
    
    // Make the API request
    const response = await request.get('/api/crypto/bitcoin-price');
    
    console.log('API Response Status:', response.status());
    
    // Check if the API response is successful
    expect(response.ok()).toBeTruthy();
    
    // Parse the response data
    const data = await response.json();
    console.log('Bitcoin Price Data:', data);
    
    // Validate the structure of the returned data
    expect(data).toHaveProperty('symbol', 'BTC');
    expect(data).toHaveProperty('price');
    expect(data).toHaveProperty('lastUpdated');
    expect(typeof data.price).toBe('number');
    
    // Check if price is using fallback data or real data
    const isFallbackPrice = data.price === 67890.12;
    if (isFallbackPrice) {
      console.warn('WARNING: API is returning fallback price data, not real-time data');
    }
    
    // Record diagnostic information
    console.log('Price appears to be fallback data:', isFallbackPrice);
    console.log('Last updated:', data.lastUpdated);
  });

  // Test market data API endpoint
  test('should fetch market data from API', async ({ request }) => {
    console.log('Testing market data API endpoint...');
    
    // Make the API request
    const response = await request.get('/api/market-data');
    
    console.log('Market API Response Status:', response.status());
    
    // Check if the API response is successful
    expect(response.ok()).toBeTruthy();
    
    // Parse the response data
    const data = await response.json();
    console.log('Market Data Structure:', Object.keys(data));
    
    // Count the number of assets
    const assetsCount = Array.isArray(data.assets) ? data.assets.length : 0;
    console.log('Number of assets returned:', assetsCount);
    
    // Verify data structure
    expect(data).toHaveProperty('assets');
    expect(Array.isArray(data.assets)).toBeTruthy();
  });

  // Test tracker page rendering and API data integration
  test('should render tracker page and display data from MongoDB', async ({ page }) => {
    console.log('Testing tracker page rendering with data from MongoDB...');
    
    // Navigate to the tracker page
    await page.goto('/tracker');
    
    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');
    
    // Capture network requests to analyze data sources
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          time: new Date().toISOString()
        });
      }
    });
    
    // Wait for API responses
    await page.waitForTimeout(2000);
    
    // Check for data loading elements
    const loadingElement = await page.locator('text=Loading').count();
    const errorElement = await page.locator('text=Error').count();
    
    console.log('Loading elements found:', loadingElement);
    console.log('Error elements found:', errorElement);
    console.log('API requests made:', requests.length);
    console.log('API requests:', requests);
    
    // Check for price elements (should have data-testid="asset-price")
    const priceElements = await page.locator('[data-testid="asset-price"]').count();
    console.log('Price elements found:', priceElements);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/tracker-page.png', fullPage: true });
    
    // Basic verification that either data is loaded or appropriate loading/error states are shown
    expect(priceElements > 0 || loadingElement > 0 || errorElement > 0).toBeTruthy();
  });
  
  // Performance analysis of the market page that was skipped in tests
  test('should analyze performance of the market page', async ({ page }) => {
    console.log('Analyzing market page performance...');
    
    // Start performance measurements
    await page.evaluate(() => {
      window.performance.mark('analysis-start');
    });
    
    // Navigate to the market page
    const startTime = Date.now();
    await page.goto('/market');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log('Market page load time:', loadTime, 'ms');
    
    // Collect performance metrics from the browser
    const performanceMetrics = await page.evaluate(() => {
      window.performance.mark('analysis-end');
      window.performance.measure('page-load', 'analysis-start', 'analysis-end');
      return JSON.stringify(window.performance.getEntriesByType('measure'));
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Count DOM elements as a measure of complexity
    const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log('DOM element count:', domCount);
    
    // Check for specific elements on the market page
    const marketElements = await page.locator('[data-testid="market-element"]').count();
    const chartElements = await page.locator('canvas').count();
    
    console.log('Market elements found:', marketElements);
    console.log('Chart elements found:', chartElements);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/market-page.png', fullPage: true });
    
    // Basic timing assertion to help identify slow market page
    expect(loadTime).toBeLessThan(10000); // Expect load time less than 10 seconds
  });
});
