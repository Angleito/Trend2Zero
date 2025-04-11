const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

(async () => {
  console.log('Starting direct chart test...');
  
  // Launch the browser with all security features disabled for testing
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--allow-file-access-from-files',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Navigate to our new debug page
    console.log('Navigating to chart debug page...');
    await page.goto('http://localhost:3001/test/chart-debug');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Chart Debug Page")');
    console.log('Page loaded successfully');
    
    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'chart-debug-initial.png') });
    console.log('Initial screenshot captured');
    
    // Wait for a while to let the chart initialize
    console.log('Waiting for chart to initialize...');
    await page.waitForTimeout(5000);
    
    // Check for chart containers
    const chartContainers = await page.$$('[data-testid="chart-container"]');
    console.log(`Chart containers found: ${chartContainers.length}`);
    
    // Check for canvas elements
    const canvasElements = await page.$$('canvas');
    console.log(`Canvas elements found: ${canvasElements.length}`);
    
    // Take another screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'chart-debug-after-wait.png') });
    console.log('Screenshot after wait captured');
    
    // Click the "Force Re-render" button
    console.log('Clicking Force Re-render button...');
    await page.click('text=Force Re-render');
    
    // Wait again
    console.log('Waiting after re-render...');
    await page.waitForTimeout(5000);
    
    // Check for canvas elements again
    const canvasElementsAfterRerender = await page.$$('canvas');
    console.log(`Canvas elements after re-render: ${canvasElementsAfterRerender.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'chart-debug-final.png') });
    console.log('Final screenshot captured');
    
    // Wait for manual inspection
    console.log('Waiting for 20 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed. Test complete.');
  }
})();
