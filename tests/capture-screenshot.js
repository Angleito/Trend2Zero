const { chromium } = require('@playwright/test');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({ headless: false });
  
  // Create a new context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: 'videos/' }
  });
  
  // Create a new page
  const page = await context.newPage();
  
  try {
    // Navigate to the home page
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000/', { timeout: 30000 });
    await page.screenshot({ path: 'home-page.png' });
    console.log('Home page screenshot saved');
    
    // Navigate to the tracker page
    console.log('Navigating to tracker page...');
    await page.goto('http://localhost:3000/tracker', { timeout: 30000 });
    await page.screenshot({ path: 'tracker-page.png' });
    console.log('Tracker page screenshot saved');
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
    
    // Wait for user to see the page
    console.log('Screenshots captured. Press Ctrl+C to close the browser.');
    await new Promise(resolve => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
})();
