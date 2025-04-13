const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({
    headless: true // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to the test page for TradingViewLightweightChart
    console.log('Navigating to the chart test page...');
    await page.goto('http://localhost:3000/test/chart');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'chart-page-screenshot.png' });
    
    // Get the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for any console errors
    console.log('Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Wait for a moment to collect console errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the TradingViewLightweightChart component is present
    console.log('Checking for TradingViewLightweightChart component...');
    const chartExists = await page.evaluate(() => {
      // Look for elements that might be part of the chart
      return document.querySelector('canvas') !== null;
    });
    
    if (chartExists) {
      console.log('TradingViewLightweightChart component found!');
      
      // Take another screenshot after the chart has loaded
      await page.screenshot({ path: 'chart-loaded-screenshot.png' });
    } else {
      console.log('TradingViewLightweightChart component not found.');
      
      // Check for any visible error messages on the page
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-red-500');
        return errorElement ? errorElement.textContent : null;
      });
      
      if (errorMessage) {
        console.log(`Error message on page: ${errorMessage}`);
      }
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
