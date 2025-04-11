// scripts/open-playwright-report.js
// Usage: node scripts/open-playwright-report.js [reportUrlOrPath]
// Default: http://localhost:52833

const puppeteer = require('puppeteer');

async function openReport() {
  const reportUrl = process.argv[2] || 'http://localhost:52833';
  let browser;
  try {
    // Launch Chromium (headful for visibility)
    browser = await puppeteer.launch({
      headless: false,
      // Optionally, you could connect to an existing browser with puppeteer.connect if a wsEndpoint is known
      // executablePath: 'chromium' // Uncomment and set if you want to use a specific Chromium binary
    });
    const page = await browser.newPage();
    await page.goto(reportUrl, { waitUntil: 'load', timeout: 60000 });
    console.log(`✅ Playwright report opened at: ${reportUrl}`);
    // Do not close the browser so the user can view the report
  } catch (err) {
    console.error('❌ Failed to open Playwright report:', err);
    process.exit(1);
  }
}

openReport();