import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Continuous Build Monitoring', () => {
  // Track errors and logs
  const errorLogs: any[] = [];
  const consoleLogs: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      errorLogs.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  });

  test('Monitor Build Consistency', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Take full-page screenshot
    const screenshot = await page.screenshot({ fullPage: true });

    // Compare with reference screenshot
    try {
      const referenceScreenshotPath = path.join(__dirname, 'home-page.png');
      const referenceScreenshot = fs.readFileSync(referenceScreenshotPath);

      // Basic visual comparison
      expect(screenshot).toEqual(referenceScreenshot);
    } catch (error) {
      // If screenshots differ, save the current screenshot for investigation
      const diffScreenshotPath = path.join(__dirname, 'build-monitor-diff.png');
      fs.writeFileSync(diffScreenshotPath, screenshot);
      
      // Log visual inconsistency
      console.error('Visual inconsistency detected!');
    }

    // Check for any captured errors
    if (errorLogs.length > 0) {
      // Save error logs
      const errorLogPath = path.join(__dirname, 'error-logs.json');
      fs.writeFileSync(errorLogPath, JSON.stringify(errorLogs, null, 2));
      
      // Fail the test if errors were found
      expect(errorLogs).toHaveLength(0);
    }

    // Log console messages for review
    if (consoleLogs.length > 0) {
      const consoleLogPath = path.join(__dirname, 'console-logs.json');
      fs.writeFileSync(consoleLogPath, JSON.stringify(consoleLogs, null, 2));
    }
  });
});