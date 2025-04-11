const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({
    headless: false // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Test normal chart rendering
    console.log('Navigating to the TradingViewLightweightChart test page...');
    await page.goto('http://localhost:3000/test/tradingviewlightweightchart');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the initial page
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'tradingviewlightweightchart-initial.png' });
    
    // Check for console errors
    console.log('Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.error(`Console error: ${msg.text()}`);
      }
    });
    
    // Wait for chart containers and ensure they are present
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")', { state: 'visible', timeout: 10000 });
    const chartContainers = await page.$$('.h-64');
    console.log(`Number of chart containers found: ${chartContainers.length}`);
    
    // Wait a bit to ensure charts have time to render
    await page.waitForTimeout(2000);
    
    // Check canvas elements
    const canvasElements = await page.$$('canvas');
    console.log(`Number of canvas elements found: ${canvasElements.length}`);
    
    // Take a screenshot of the chart
    await page.screenshot({ path: 'tradingviewlightweightchart-chart.png' });
    
    // Test error handling mode
    console.log('Testing error handling mode...');
    await page.goto('http://localhost:3000/test/tradingviewlightweightchart?error=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for error message
    const errorMessage = await page.getByTestId('error-message');
    const errorText = await errorMessage.textContent();
    console.log(`Error message: ${errorText}`);
    
    // Take a screenshot of the error state
    await page.screenshot({ path: 'tradingviewlightweightchart-error.png' });
    
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
