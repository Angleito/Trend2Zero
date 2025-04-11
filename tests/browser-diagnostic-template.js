const { chromium } = require('playwright');

async function runBrowserDiagnostics(url, options = {}) {
  const {
    screenshotPrefix = 'diagnostic',
    errorMode = false,
    waitForSelector = null,
    checkElements = [],
    consoleErrorLogging = true
  } = options;

  // Launch the browser
  const browser = await chromium.launch({
    headless: false // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    console.log(`Navigating to: ${url}`);
    
    // Append error mode to URL if specified
    const fullUrl = errorMode ? `${url}?error=true` : url;
    
    await page.goto(fullUrl);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: `${screenshotPrefix}-initial.png` });
    
    // Console error tracking
    if (consoleErrorLogging) {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
          console.error(`Console error: ${msg.text()}`);
        }
      });
    }
    
    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { state: 'visible', timeout: 10000 });
    }
    
    // Check for specific elements
    for (const elementCheck of checkElements) {
      const { selector, type = 'exists', expectedCount } = elementCheck;
      const elements = await page.$$(selector);
      
      switch (type) {
        case 'exists':
          console.log(`Elements matching ${selector}: ${elements.length}`);
          break;
        case 'count':
          console.assert(elements.length === expectedCount, 
            `Expected ${expectedCount} elements, found ${elements.length}`);
          break;
      }
    }
    
    // Take diagnostic screenshot
    await page.screenshot({ path: `${screenshotPrefix}-diagnostic.png` });
    
    // Wait for user inspection
    console.log('Waiting for 10 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error during diagnostic testing:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
}

// Example usage (comment out or remove in final version)
// runBrowserDiagnostics('http://localhost:3000/test/some-component', {
//   screenshotPrefix: 'component-test',
//   waitForSelector: 'h1:has-text("Component Test")',
//   checkElements: [
//     { selector: '.test-class', type: 'exists' },
//     { selector: '.count-check', type: 'count', expectedCount: 4 }
//   ]
// });

module.exports = { runBrowserDiagnostics };