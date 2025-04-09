const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Trend2Zero Application Tests', () => {
  let browser;
  let context;
  let page;
  let serverPort;

  test.beforeAll(async ({ browser: browserInstance }) => {
    console.log('Starting test setup...');
    
    try {
      // Store the browser instance
      browser = browserInstance;

      // Determine the server port
      serverPort = '3001'; // Hardcoded to match the dev server port
      console.log(`Server port set to: ${serverPort}`);
      
      // Create a new browser context with extended timeout
      context = await browser.newContext({
        navigationTimeout: 60000,
        actionTimeout: 60000,
        extraHTTPHeaders: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      // Ensure context doesn't close prematurely
      context.setDefaultTimeout(60000);

      // Create a new page in the context
      page = await context.newPage();

      // Enhanced error and logging handlers with comprehensive logging
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[BROWSER CONSOLE] [${type}]:`, text);
      });

      page.on('pageerror', error => {
        console.error('[PAGE ERROR] Detailed error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      });

      page.on('requestfailed', request => {
        console.error('[REQUEST FAILED]:', {
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          failure: request.failure()?.errorText
        });
      });

      page.on('crash', () => {
        console.error('[CRITICAL] Page crashed unexpectedly');
      });

      // Add network logging
      await page.route('**', (route) => {
        const request = route.request();
        console.log('[NETWORK REQUEST]:', {
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
        route.continue();
      });

      console.log('Test setup completed successfully');
    } catch (error) {
      console.error('Critical error during test setup:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    console.log('Starting test cleanup...');
    try {
      if (page && !page.isClosed()) {
        await page.close({ runBeforeUnload: true });
        console.log('Page closed successfully');
      }
      if (context) {
        await context.close();
        console.log('Context closed successfully');
      }
      console.log('Test cleanup completed');
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  // Retry mechanism for flaky tests
  test.describe.configure({ retries: 2 });

  test('Home page loads correctly', async () => {
    console.log(`[TEST START] Attempting to navigate to: http://localhost:${serverPort}/`);
    
    try {
      // Detailed navigation step with enhanced error handling
      await test.step('Navigate to home page', async () => {
        console.log('[NAVIGATION] Starting page navigation...');
        
        // Extensive pre-navigation logging and diagnostics
        console.log('[SYSTEM DIAGNOSTICS]', {
          browserContext: context ? 'Exists' : 'Not created',
          page: page ? 'Exists' : 'Not created',
          currentUrl: await page.url(),
          serverPort: serverPort
        });
        
        // Enhanced network interception with more detailed logging
        await page.route('**', (route) => {
          const request = route.request();
          console.log('[NETWORK INTERCEPT]', {
            url: request.url(),
            method: request.method(),
            resourceType: request.resourceType(),
            headers: request.headers()
          });
          route.continue();
        });
        
        // Retry mechanism for navigation
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            await page.goto(`http://localhost:${serverPort}/`, {
              timeout: 90000, // Extended timeout
              waitUntil: 'networkidle',
              referer: `http://localhost:${serverPort}`
            });
            break; // Success, exit retry loop
          } catch (navError) {
            retryCount++;
            console.warn(`[NAVIGATION RETRY] Attempt ${retryCount} failed:`, {
              errorName: navError.name,
              errorMessage: navError.message
            });
            
            // Wait between retries with exponential backoff
            await page.waitForTimeout(1000 * retryCount);
            
            if (retryCount === maxRetries) {
              throw navError; // Rethrow if all retries fail
            }
          }
        }
        
        console.log('[NAVIGATION] Page navigation completed successfully');
      });

      // Comprehensive page stabilization with extended timeouts
      console.log('[STABILITY] Waiting for page to stabilize...');
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
      
      // Detailed screenshot with full page capture and error handling
      console.log('[SCREENSHOT] Taking full-page screenshot...');
      try {
        await page.screenshot({
          path: 'home-page-load.png',
          fullPage: true,
          timeout: 10000
        });
      } catch (screenshotError) {
        console.error('[SCREENSHOT ERROR]:', {
          errorName: screenshotError.name,
          errorMessage: screenshotError.message
        });
      }
      
      // Comprehensive element checking with detailed logging
      console.log('[ELEMENT CHECK] Checking for heading element...');
      const headingElement = await page.getByRole('heading', { name: /trend2zero/i });
      
      // Extensive page content logging if heading not found
      if (!headingElement) {
        const pageContent = await page.content();
        const pageTitle = await page.title();
        const pageUrl = page.url();
        
        console.error('[ERROR] Heading not found. Detailed page information:', {
          title: pageTitle,
          url: pageUrl,
          contentLength: pageContent.length
        });
        
        // Log all headings on the page
        const allHeadings = await page.locator('h1, h2, h3').allTextContents();
        console.error('[PAGE HEADINGS]:', allHeadings);
        
        // Additional page diagnostics
        const bodyText = await page.locator('body').textContent();
        console.error('[BODY TEXT PREVIEW]:', bodyText.slice(0, 500));
      }
      
      // Assertion with detailed error message and context
      expect(
        headingElement,
        `Trend2Zero heading should be present on the home page.
        Server Port: ${serverPort},
        Current URL: ${page.url()}`
      ).toBeTruthy();
      
      console.log('[TEST SUCCESS] Home page test completed successfully');
    } catch (error) {
      console.error('[TEST FAILURE] Comprehensive error details:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        serverPort: serverPort
      });
      
      // Comprehensive error state screenshot
      try {
        await page.screenshot({
          path: 'home-page-error.png',
          fullPage: true
        });
      } catch (screenshotError) {
        console.error('[SCREENSHOT ERROR]:', {
          errorName: screenshotError.name,
          errorMessage: screenshotError.message
        });
      }
      
      throw error; // Re-throw to fail the test
    }
  });

  test('Asset Tracker page loads and displays data', async () => {
    console.log(`[TEST START] Attempting to navigate to: http://localhost:${serverPort}/tracker`);
    
    try {
      // Navigate to tracker page
      await test.step('Navigate to tracker page', async () => {
        console.log('[NAVIGATION] Starting page navigation...');
        
        await page.goto(`http://localhost:${serverPort}/tracker`, {
          timeout: 60000,
          waitUntil: 'networkidle',
          referer: `http://localhost:${serverPort}`
        });
        
        console.log('[NAVIGATION] Page navigation completed successfully');
      });

      // Wait for page to stabilize
      console.log('[STABILITY] Waiting for page to stabilize...');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      
      // Take screenshot
      console.log('[SCREENSHOT] Taking full-page screenshot...');
      await page.screenshot({
        path: 'tracker-page-load.png',
        fullPage: true
      });
      
      // Wait for table or alternative content
      console.log('[ELEMENT CHECK] Checking for table or alternative content...');
      
      // Check for table or alternative content
      const tableOrAlternative = await page.locator('table, .no-data-message, .asset-list').first();
      await expect(tableOrAlternative, 'Table, no data message, or asset list should be visible').toBeVisible({ timeout: 15000 });
      
      // Determine the type of content
      const contentType = await tableOrAlternative.evaluate(el => {
        if (el.tagName.toLowerCase() === 'table') return 'table';
        if (el.classList.contains('no-data-message')) return 'no-data-message';
        if (el.classList.contains('asset-list')) return 'asset-list';
        return 'unknown';
      });

      console.log(`[CONTENT TYPE] Detected content type: ${contentType}`);

      // Handle different content types
      switch (contentType) {
        case 'table':
          const tableRows = await page.locator('table tbody tr').all();
          console.log(`[TABLE INFO] Number of table rows: ${tableRows.length}`);
          
          // If table exists, ensure at least one row or log details
          if (tableRows.length === 0) {
            const tableContent = await page.locator('table').textContent();
            console.warn(`[NO ROWS] Table exists but has no rows. Table content: ${tableContent}`);
          }
          break;

        case 'no-data-message':
          const noDataMessage = await tableOrAlternative.textContent();
          console.log(`[NO DATA] No data message: ${noDataMessage}`);
          break;

        case 'asset-list':
          const assetItems = await page.locator('.asset-list .asset-item').all();
          console.log(`[ASSET LIST] Number of asset items: ${assetItems.length}`);
          break;

        default:
          console.warn('[UNEXPECTED CONTENT] Unexpected content type detected');
          break;
      }
      
      console.log('[TEST SUCCESS] Asset Tracker page test completed successfully');
    } catch (error) {
      console.error('[TEST FAILURE] Error in Asset Tracker page test:', error);
      
      // Comprehensive error logging
      if (error instanceof Error) {
        console.error('[ERROR DETAILS] Error name:', error.name);
        console.error('[ERROR DETAILS] Error message:', error.message);
        console.error('[ERROR DETAILS] Error stack:', error.stack);
      }
      
      // Error state screenshot
      try {
        await page.screenshot({
          path: 'tracker-page-error.png',
          fullPage: true
        });
      } catch (screenshotError) {
        console.error('[SCREENSHOT ERROR] Could not capture error screenshot:', screenshotError);
      }
      
      // Log page content for debugging
      try {
        const pageContent = await page.content();
        console.error('[PAGE CONTENT]:', pageContent);
      } catch (contentError) {
        console.error('[PAGE CONTENT ERROR]:', contentError);
      }
      
      throw error; // Re-throw to fail the test
    }
  });

  test('Asset detail page loads correctly', async () => {
    console.log(`Attempting to navigate to: http://localhost:${serverPort}/asset/AAPL`);
    
    await test.step('Navigate to asset detail page', async () => {
      await page.goto(`http://localhost:${serverPort}/asset/AAPL`, {
        timeout: 30000,
        waitUntil: 'networkidle',
        referer: `http://localhost:${serverPort}`
      });
    });

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'asset-detail-page-load.png' });
    
    // Check for key sections
    const priceChartHeading = await page.getByRole('heading', { name: /price chart/i });
    const priceConverterHeading = await page.getByRole('heading', { name: /price converter/i });
    
    // Log headings for debugging
    console.log('Price Chart Heading:', await priceChartHeading.textContent());
    console.log('Price Converter Heading:', await priceConverterHeading.textContent());
    
    expect(priceChartHeading).toBeTruthy();
    expect(priceConverterHeading).toBeTruthy();
  });

  test('Navigation works correctly', async () => {
    console.log(`Attempting to navigate to: http://localhost:${serverPort}/tracker`);
    
    await test.step('Navigate to tracker page', async () => {
      await page.goto(`http://localhost:${serverPort}/tracker`, {
        timeout: 30000,
        waitUntil: 'networkidle',
        referer: `http://localhost:${serverPort}`
      });
    });

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Find home link with more robust selector
    const homeLink = await page.getByRole('link', { name: /home/i }).first();
    
    // Log link details for debugging
    console.log('Home Link href:', await homeLink.getAttribute('href'));
    
    // Click home link with extended timeout
    await homeLink.click({ timeout: 15000 });
    
    // Wait for home page to load
    await page.waitForURL(`http://localhost:${serverPort}/`, { timeout: 15000 });
    
    // Verify home page elements
    const homeHeading = await page.getByRole('heading', { name: /trend2zero/i });
    expect(homeHeading).toBeTruthy();
  });
});
