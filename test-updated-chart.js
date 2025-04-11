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
    
    // Take a screenshot
    console.log('Taking a screenshot...');
    await page.screenshot({ path: 'updated-charts-page.png' });
    
    // Check if canvas elements are created (charts use canvas)
    const canvasElements = await page.$$('canvas');
    console.log(`Found ${canvasElements.length} canvas elements`);
    
    // Wait for a moment to see the page
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
