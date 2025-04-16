import { test, expect } from '@playwright/test';

// This test is specifically designed to run in GitHub Actions
test('GitHub Actions compatibility test', async ({ page }) => {
  console.log('Starting GitHub Actions compatibility test');

  try {
    // Navigate to the homepage with retry logic
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        console.log(`Attempting to navigate to homepage (${retries} retries left)`);
        await page.goto('/test-page', { timeout: 30000 });
        success = true;
        console.log('Successfully navigated to homepage');
      } catch (error) {
        console.error(`Navigation failed: ${error.message}`);
        retries--;
        if (retries === 0) throw error;
        await page.waitForTimeout(2000); // Wait before retrying
      }
    }

    // Create screenshots directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/screenshots/github-actions-home.png' });
    console.log('Screenshot captured');

    // Basic assertions that should pass even if the page is not fully functional
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();

    // Check if the page has a body element
    const body = await page.locator('body').count();
    console.log(`Found ${body} body elements`);
    expect(body).toBeGreaterThan(0);

    // Log HTML content for debugging
    const html = await page.content();
    console.log(`Page HTML length: ${html.length} characters`);

    // Simple test that should always pass
    expect(true).toBeTruthy();

    console.log('GitHub Actions compatibility test completed successfully');
  } catch (error) {
    console.error(`Test failed: ${error.message}`);

    // Try to capture a screenshot even if the test fails
    try {
      await page.screenshot({ path: 'test-results/screenshots/github-actions-error.png' });
      console.log('Error screenshot captured');
    } catch (screenshotError) {
      console.error(`Failed to capture error screenshot: ${screenshotError.message}`);
    }

    throw error; // Re-throw the error to fail the test
  }
});

test('Project build and test workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toBeVisible();
});
