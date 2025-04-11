const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper function to log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

// Helper function to save response to file
function saveResponseToFile(filename, data) {
  fs.writeFileSync(
    path.join(screenshotsDir, filename),
    typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  );
  logWithTimestamp(`Response saved to ${filename}`);
}

(async () => {
  logWithTimestamp('Starting mock integration test...');

  // Launch the browser
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-web-security']
  });

  // Create a new page
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    timeout: 60000
  });

  // Collect all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });

    if (type === 'error') {
      logWithTimestamp(`Console ERROR: ${text}`);
    } else if (type === 'warning') {
      logWithTimestamp(`Console WARNING: ${text}`);
    } else {
      logWithTimestamp(`Console ${type}: ${text}`);
    }
  });

  try {
    // Test Vercel mock integration
    logWithTimestamp('Testing Vercel mock integration in development environment...');

    // Test environment config endpoint
    await page.goto('http://localhost:3000/api/mock-integration?endpoint=environment-config', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    // Wait for the response
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && pre.textContent.includes('environment');
    }, { timeout: 10000 });

    // Get the response
    const vercelConfigResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector('pre').textContent);
    });

    logWithTimestamp('Vercel environment config:');
    console.log(JSON.stringify(vercelConfigResponse, null, 2));
    saveResponseToFile('vercel-environment-config.json', vercelConfigResponse);

    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'vercel-environment-config.png') });

    // Test crypto endpoint
    await page.goto('http://localhost:3000/api/mock-integration?endpoint=crypto', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    // Wait for the response
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && pre.textContent.includes('data');
    }, { timeout: 10000 });

    // Get the response
    const vercelCryptoResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector('pre').textContent);
    });

    logWithTimestamp('Vercel crypto response:');
    console.log(JSON.stringify(vercelCryptoResponse.data.data[0], null, 2));
    saveResponseToFile('vercel-crypto-response.json', vercelCryptoResponse);

    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'vercel-crypto-response.png') });

    // Test historical endpoint
    await page.goto('http://localhost:3000/api/mock-integration?endpoint=historical&symbol=BTC&days=10', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    // Wait for the response
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && pre.textContent.includes('data');
    }, { timeout: 10000 });

    // Get the response
    const vercelHistoricalResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector('pre').textContent);
    });

    logWithTimestamp('Vercel historical response:');
    console.log(`Received ${vercelHistoricalResponse.data.length} data points`);
    saveResponseToFile('vercel-historical-response.json', vercelHistoricalResponse);

    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'vercel-historical-response.png') });

    // Test Vercel environment simulation
    logWithTimestamp('Testing Vercel environment simulation...');

    // Test with environment parameter set to 'vercel'
    await page.goto('http://localhost:3000/api/mock-integration?endpoint=environment-config&environment=vercel', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    // Wait for the response
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && pre.textContent.includes('environment');
    }, { timeout: 10000 });

    // Get the response
    const mockVercelConfigResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector('pre').textContent);
    });

    logWithTimestamp('Mock Vercel environment config:');
    console.log(JSON.stringify(mockVercelConfigResponse, null, 2));
    saveResponseToFile('mock-vercel-environment-config.json', mockVercelConfigResponse);

    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'mock-vercel-environment-config.png') });

    // Test asset endpoint with Vercel environment
    await page.goto('http://localhost:3000/api/mock-integration?endpoint=asset&symbol=BTC&environment=vercel', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    // Wait for the response
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && pre.textContent.includes('data');
    }, { timeout: 10000 });

    // Get the response
    const mockVercelAssetResponse = await page.evaluate(() => {
      return JSON.parse(document.querySelector('pre').textContent);
    });

    logWithTimestamp('Mock Vercel asset response:');
    console.log(JSON.stringify(mockVercelAssetResponse.data, null, 2));
    saveResponseToFile('mock-vercel-asset-response.json', mockVercelAssetResponse);

    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'mock-vercel-asset-response.png') });

    // Test Strapi mock integration (if available)
    logWithTimestamp('Testing Strapi mock integration...');

    try {
      // Test if Strapi is running
      await page.goto('http://localhost:1337/admin', {
        timeout: 5000,
        waitUntil: 'domcontentloaded'
      });

      // If we get here, Strapi is running
      logWithTimestamp('Strapi is running, testing mock integration...');

      // Test mock data endpoint
      await page.goto('http://localhost:1337/mock-integration/mock-data?endpoint=environment-config');

      // Wait for the response
      await page.waitForFunction(() => {
        const pre = document.querySelector('pre');
        return pre && pre.textContent.includes('environment');
      });

      // Get the response
      const strapiConfigResponse = await page.evaluate(() => {
        return JSON.parse(document.querySelector('pre').textContent);
      });

      logWithTimestamp('Strapi environment config:');
      console.log(JSON.stringify(strapiConfigResponse, null, 2));
      saveResponseToFile('strapi-environment-config.json', strapiConfigResponse);

      // Take a screenshot
      await page.screenshot({ path: path.join(screenshotsDir, 'strapi-environment-config.png') });
    } catch (error) {
      logWithTimestamp(`Strapi is not running: ${error.message}`);
      saveResponseToFile('strapi-error.txt', `Strapi is not running: ${error.message}`);

      // Since Strapi is not running, let's simulate a Strapi environment in the mock integration
      logWithTimestamp('Simulating Strapi environment in mock integration...');

      try {
        // Create a new page for Strapi tests to avoid navigation issues
        const strapiPage = await browser.newPage();

        // Test with environment parameter set to 'strapi'
        await strapiPage.goto('http://localhost:3000/api/mock-integration?endpoint=environment-config&environment=strapi', {
          timeout: 10000,
          waitUntil: 'domcontentloaded'
        });

        // Wait for the response
        await strapiPage.waitForFunction(() => {
          const pre = document.querySelector('pre');
          return pre && pre.textContent.includes('environment');
        }, { timeout: 5000 });

        // Get the response
        const mockStrapiConfigResponse = await strapiPage.evaluate(() => {
          return JSON.parse(document.querySelector('pre').textContent);
        });

        logWithTimestamp('Mock Strapi environment config:');
        console.log(JSON.stringify(mockStrapiConfigResponse, null, 2));
        saveResponseToFile('mock-strapi-environment-config.json', mockStrapiConfigResponse);

        // Take a screenshot
        await strapiPage.screenshot({ path: path.join(screenshotsDir, 'mock-strapi-environment-config.png') });

        // Test crypto endpoint with Strapi environment
        await strapiPage.goto('http://localhost:3000/api/mock-integration?endpoint=crypto&environment=strapi', {
          timeout: 10000,
          waitUntil: 'domcontentloaded'
        });

        // Wait for the response
        await strapiPage.waitForFunction(() => {
          const pre = document.querySelector('pre');
          return pre && pre.textContent.includes('data');
        }, { timeout: 5000 });

        // Get the response
        const mockStrapiCryptoResponse = await strapiPage.evaluate(() => {
          return JSON.parse(document.querySelector('pre').textContent);
        });

        logWithTimestamp('Mock Strapi crypto response:');
        console.log(JSON.stringify(mockStrapiCryptoResponse.data.data[0], null, 2));
        saveResponseToFile('mock-strapi-crypto-response.json', mockStrapiCryptoResponse);

        // Take a screenshot
        await strapiPage.screenshot({ path: path.join(screenshotsDir, 'mock-strapi-crypto-response.png') });

        // Close the Strapi test page
        await strapiPage.close();
      } catch (strapiError) {
        logWithTimestamp(`Error in Strapi environment simulation: ${strapiError.message}`);
        saveResponseToFile('strapi-simulation-error.txt', `Error in Strapi environment simulation: ${strapiError.message}`);
      }
    }

    // Wait for manual inspection
    logWithTimestamp('Waiting for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    logWithTimestamp(`ERROR during testing: ${error.message}`);
    console.error(error);
    saveResponseToFile('test-error.txt', error.toString());
  } finally {
    // Close the browser
    await browser.close();
    logWithTimestamp('Browser closed. Test complete.');

    // Print summary
    logWithTimestamp('TEST SUMMARY:');
    logWithTimestamp(`- Screenshots and reports saved to: ${screenshotsDir}`);
    logWithTimestamp(`- Total console messages: ${consoleMessages.length}`);
    logWithTimestamp(`- Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
  }
})();
