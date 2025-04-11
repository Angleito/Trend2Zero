const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({
    headless: false // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to your local development server
    console.log('Navigating to the local development server...');
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'local-screenshot.png' });
    
    // Get the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for any console errors
    console.log('Checking for console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Navigate to the test page for TradingViewLightweightChart
    console.log('Navigating to the test page for TradingViewLightweightChart...');
    await page.goto('http://localhost:3000/test/tradingviewlightweightchart');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the test page
    console.log('Taking a screenshot of the test page...');
    await page.screenshot({ path: 'chart-test-screenshot.png' });
    
    // Check if the TradingViewLightweightChart component is present
    console.log('Checking for TradingViewLightweightChart component...');
    const chartExists = await page.evaluate(() => {
      // Look for elements that might be part of the chart
      return document.querySelector('canvas') !== null;
    });
    
    if (chartExists) {
      console.log('TradingViewLightweightChart component found!');
    } else {
      console.log('TradingViewLightweightChart component not found.');
    }
    
    // Wait for user to see the page
    console.log('Waiting for 10 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
})();
