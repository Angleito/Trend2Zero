#!/usr/bin/env node

const { chromium, firefox, webkit } = require('playwright');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const httpServer = require('http-server');

async function startServer(publicDir) {
  const server = httpServer.createServer({
    root: publicDir,
    cors: true,
    cache: -1
  });
  
  await new Promise((resolve) => {
    server.listen(8080, 'localhost', () => {
      console.log('[DEBUG] Local server started at http://localhost:8080');
      resolve();
    });
  });
  
  return server;
}

async function runBrowserTests() {
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'vercel-build-config.json'), 'utf8'));
  const resultsDir = path.resolve(__dirname, '../test-results');
  const testPagePath = path.resolve(__dirname, '../public/vercel-build-test.html');
  
  const publicDir = path.resolve(__dirname, '../public');
  
  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Start local server
  const server = await startServer(publicDir);

  console.log('[DEBUG] Starting Playwright multi-browser testing...');
  try {
    // Playwright multi-browser testing
    const playwrightResults = {};
    for (const browserType of config.testEnvironments.playwright.browsers) {
      console.log(`[DEBUG] Launching Playwright browser: ${browserType}`);
      const browser = await {
        chromium: chromium,
        firefox: firefox,
        webkit: webkit
      }[browserType].launch({
        headless: config.testEnvironments.puppeteer.headless
      });
      
      const context = await browser.newContext({
        viewport: config.testEnvironments.puppeteer.browserOptions.defaultViewport
      });
      const page = await context.newPage();

      try {
        console.log(`[DEBUG] Navigating to site in ${browserType}...`);
        await page.goto('http://localhost:8080/vercel-build-test.html', {
          timeout: config.testEnvironments.playwright.timeout
        });

        console.log(`[DEBUG] Taking screenshot in ${browserType}...`);
        await page.screenshot({
          path: path.resolve(resultsDir, `${browserType}-screenshot.png`)
        });

        // Performance metrics
        const metrics = await page.evaluate(() => performance.getEntriesByType('navigation')[0]);
        playwrightResults[browserType] = {
          loadTime: metrics.loadEventEnd - metrics.startTime,
          domContentLoaded: metrics.domContentLoadedEventEnd - metrics.startTime
        };

        await browser.close();
        console.log(`[DEBUG] Closed ${browserType} browser.`);
      } catch (error) {
        console.error(`Playwright ${browserType} test failed:`, error);
        playwrightResults[browserType] = { error: error.message };
      }
    }

    // Puppeteer testing
    console.log('[DEBUG] Launching Puppeteer...');
    // Take performance trace with Puppeteer
    const browser = await puppeteer.launch({
      headless: config.testEnvironments.puppeteer.headless
    });
    const page = await browser.newPage();
    await page.setViewport(config.testEnvironments.puppeteer.browserOptions.defaultViewport);

    console.log('[DEBUG] Navigating to site in Puppeteer...');
    await page.goto('http://localhost:8080/vercel-build-test.html', {
      timeout: config.testEnvironments.puppeteer.timeout,
      waitUntil: 'networkidle0'
    });

    console.log('[DEBUG] Starting performance trace...');
    await page.tracing.start({ path: path.resolve(resultsDir, 'performance-trace.json') });
    await page.reload();
    await page.tracing.stop();
    await browser.close();
    console.log('[DEBUG] Puppeteer closed.');

    // Let Lighthouse launch its own Chrome instance using chrome-launcher
    console.log('[DEBUG] Launching Chrome for Lighthouse...');
    const chromeLauncher = require('chrome-launcher');
    const { default: lighthouse } = await import('lighthouse');
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = { logLevel: 'info', port: chrome.port };
    console.log('[DEBUG] Running Lighthouse...');
    const { lhr } = await lighthouse(
      'http://localhost:8080/vercel-build-test.html',
      options
    );
    await chrome.kill();
    console.log('[DEBUG] Lighthouse run complete.');

    // Write comprehensive test report
    const testReport = {
      timestamp: new Date().toISOString(),
      playwrightResults,
      lighthouseScores: {
        performance: lhr.categories.performance.score * 100,
        accessibility: lhr.categories.accessibility.score * 100,
        bestPractices: lhr.categories['best-practices'].score * 100,
        seo: lhr.categories.seo.score * 100
      },
      performanceThresholdsMet: Object.entries(config.performanceThresholds).every(
        ([metric, threshold]) => {
          // Convert camelCase to kebab-case for Lighthouse audit keys
          const kebabMetric = metric.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
          return lhr.audits[kebabMetric] && lhr.audits[kebabMetric].numericValue <= threshold;
        }
      )
    };

    fs.writeFileSync(
      path.resolve(resultsDir, 'vercel-build-debug-report.json'),
      JSON.stringify(testReport, null, 2)
    );
    console.log('[DEBUG] Wrote vercel-build-debug-report.json');
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    // Cleanup: Stop the server
    server.close();
    console.log('[DEBUG] Local server stopped');
  }
}

runBrowserTests().catch(console.error);