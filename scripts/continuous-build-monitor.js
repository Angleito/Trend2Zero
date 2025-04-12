const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function continuousMonitor() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Error and log tracking
  const errorLogs = [];
  const consoleLogs = [];

  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('pageerror', (error) => {
    errorLogs.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Visual consistency check
  async function checkVisualConsistency() {
    const screenshot = await page.screenshot({ fullPage: true });
    const referenceScreenshot = fs.readFileSync('tests/home-page.png');
    
    // Basic visual diff (you might want to use a more sophisticated image comparison library)
    const isDifferent = !screenshot.equals(referenceScreenshot);
    
    return {
      isDifferent,
      currentScreenshot: screenshot
    };
  }

  // Continuous monitoring loop
  async function monitorBuild() {
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

      // Check visual consistency
      const visualCheck = await checkVisualConsistency();
      if (visualCheck.isDifferent) {
        fs.writeFileSync('build-monitor-diff.png', visualCheck.currentScreenshot);
        console.error('Visual inconsistency detected!');
      }

      // Log tracking
      if (errorLogs.length > 0) {
        fs.writeFileSync('error-logs.json', JSON.stringify(errorLogs, null, 2));
        console.error('Errors detected during monitoring');
      }

      if (consoleLogs.length > 0) {
        fs.writeFileSync('console-logs.json', JSON.stringify(consoleLogs, null, 2));
        console.log('Console logs captured');
      }

    } catch (error) {
      console.error('Monitoring failed:', error);
    }

    // Reschedule monitoring
    setTimeout(monitorBuild, 60000); // Check every minute
  }

  await monitorBuild();
}

continuousMonitor().catch(console.error);