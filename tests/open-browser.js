/**
 * IMPORTANT: This project uses Playwright exclusively for browser testing and debugging.
 * Do not use manual browser testing or other testing frameworks.
 * All browser-related components should be tested using this approach.
 */
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

  // Navigate to the tracker page
  await page.goto('http://localhost:3000/tracker');

  // Wait for the page to load
  await page.waitForSelector('h1:has-text("Asset Tracker")', { timeout: 10000 })
    .catch(e => console.error('Could not find Asset Tracker heading:', e));

  // Log console messages
  page.on('console', msg => {
    console.log(`Browser console ${msg.type()}: ${msg.text()}`);
  });

  // Log network errors
  page.on('response', response => {
    if (!response.ok() && !response.url().includes('favicon.ico')) {
      console.log(`Network error: ${response.status()} for ${response.url()}`);
    }
  });

  // Keep the browser open
  console.log('Browser opened. Press Ctrl+C to close.');
})();
