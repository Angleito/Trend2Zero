const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({
    headless: true // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to the test page
    console.log('Navigating to the TradingViewLightweightChart test page...');
    await page.goto('http://localhost:3001/test/tradingviewlightweightchart');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")');
    
    // Wait for loading spinners to disappear
    await page.waitForSelector('[data-testid="chart-loading"]', { state: 'detached', timeout: 5000 }).catch(() => {
      console.log('No loading indicators found or they disappeared quickly');
    });
    
    // Wait a bit for charts to render
    console.log('Waiting for charts to render...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'final-chart-test.png' });
    
    // Check if chart containers are present
    const chartContainers = await page.$$('[data-testid="chart-container"]');
    console.log(`Number of chart containers found: ${chartContainers.length}`);
    
    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    console.log(`Number of canvas elements found: ${canvasElements.length}`);
    
    // Wait for user to see the page
    console.log('Waiting for 10 seconds to view the page...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
})();
