const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({
    headless: false // Set to true for headless mode
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to the test page
    console.log('Navigating to the charts test page...');
    await page.goto('http://localhost:3000/test/charts');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Charts Test Page")');
    
    // Wait for a moment to allow charts to initialize
    console.log('Waiting for charts to initialize...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'updated-charts-page-with-wait.png' });
    
    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    console.log(`Found ${canvasElements.length} canvas elements`);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Console error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.warn(`Console warning: ${msg.text()}`);
      } else {
        console.log(`Console log: ${msg.text()}`);
      }
    });
    
    // Wait for a moment to see the page
    console.log('Waiting for 10 seconds to view the page...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Take another screenshot
    console.log('Taking a final screenshot...');
    await page.screenshot({ path: 'updated-charts-page-final.png' });
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
})();
