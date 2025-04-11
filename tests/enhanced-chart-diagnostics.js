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

// Helper function to save DOM snapshot
async function saveDOMSnapshot(page, filename) {
  const html = await page.content();
  fs.writeFileSync(path.join(screenshotsDir, filename), html);
  logWithTimestamp(`DOM snapshot saved to ${filename}`);
}

(async () => {
  logWithTimestamp('Starting enhanced chart diagnostics...');
  
  // Launch the browser with DevTools open for additional debugging
  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  // Create a new page with higher timeout
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
  
  // Collect network requests and responses
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    logWithTimestamp(`Page ERROR: ${error.message}`);
  });
  
  try {
    // PHASE 1: Test the simple chart page
    logWithTimestamp('PHASE 1: Testing simple chart page...');
    await page.goto('http://localhost:3000/test/simple-chart');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Simple Chart Test")', { timeout: 10000 });
    logWithTimestamp('Page loaded successfully');
    
    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'simple-chart-initial.png'), fullPage: true });
    logWithTimestamp('Initial screenshot captured');
    
    // Save DOM snapshot
    await saveDOMSnapshot(page, 'simple-chart-initial.html');
    
    // Wait for chart container
    await page.waitForSelector('[data-testid="chart-container"]', { timeout: 10000 })
      .then(() => logWithTimestamp('Chart container found'))
      .catch(() => logWithTimestamp('Chart container NOT found'));
    
    // Check for canvas elements
    await page.waitForTimeout(5000); // Wait for potential chart rendering
    const canvasElements = await page.$$('canvas');
    logWithTimestamp(`Canvas elements found: ${canvasElements.length}`);
    
    // Inject diagnostic code to check chart library initialization
    const chartDiagnostics = await page.evaluate(() => {
      const diagnostics = {
        chartContainerExists: false,
        chartContainerDimensions: null,
        chartLibraryLoaded: typeof window.LightweightCharts !== 'undefined',
        documentReady: document.readyState,
        windowInnerDimensions: { width: window.innerWidth, height: window.innerHeight },
        chartContainerChildren: []
      };
      
      // Check chart container
      const chartContainer = document.querySelector('[data-testid="chart-container"]');
      if (chartContainer) {
        diagnostics.chartContainerExists = true;
        diagnostics.chartContainerDimensions = {
          width: chartContainer.clientWidth,
          height: chartContainer.clientHeight,
          offsetWidth: chartContainer.offsetWidth,
          offsetHeight: chartContainer.offsetHeight,
          scrollWidth: chartContainer.scrollWidth,
          scrollHeight: chartContainer.scrollHeight
        };
        
        // Check children
        Array.from(chartContainer.children).forEach(child => {
          diagnostics.chartContainerChildren.push({
            tagName: child.tagName,
            className: child.className,
            id: child.id,
            width: child.clientWidth,
            height: child.clientHeight
          });
        });
      }
      
      return diagnostics;
    });
    
    logWithTimestamp('Chart diagnostics:');
    console.log(JSON.stringify(chartDiagnostics, null, 2));
    
    // Take another screenshot after waiting
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'simple-chart-after-wait.png'), fullPage: true });
    logWithTimestamp('Screenshot after wait captured');
    
    // PHASE 2: Test the full test page
    logWithTimestamp('PHASE 2: Testing full chart test page...');
    await page.goto('http://localhost:3000/test/tradingviewlightweightchart');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")', { timeout: 10000 });
    logWithTimestamp('Test page loaded successfully');
    
    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'full-chart-test-initial.png'), fullPage: true });
    logWithTimestamp('Initial test page screenshot captured');
    
    // Wait for chart containers
    const chartContainers = await page.$$('.h-64');
    logWithTimestamp(`Chart containers found: ${chartContainers.length}`);
    
    // Check for loading indicators
    const loadingIndicators = await page.$$('[data-testid="chart-loading"]');
    logWithTimestamp(`Loading indicators found: ${loadingIndicators.length}`);
    
    // Wait for loading to complete
    await page.waitForTimeout(5000);
    
    // Check for canvas elements again
    const testPageCanvasElements = await page.$$('canvas');
    logWithTimestamp(`Canvas elements on test page: ${testPageCanvasElements.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'full-chart-test-final.png'), fullPage: true });
    logWithTimestamp('Final test page screenshot captured');
    
    // Save DOM snapshot
    await saveDOMSnapshot(page, 'full-chart-test-final.html');
    
    // PHASE 3: Test error handling
    logWithTimestamp('PHASE 3: Testing error handling...');
    await page.goto('http://localhost:3000/test/tradingviewlightweightchart?error=true');
    
    // Wait for the page to load
    await page.waitForSelector('h1:has-text("TradingViewLightweightChart Test")', { timeout: 10000 });
    logWithTimestamp('Error test page loaded successfully');
    
    // Wait for error message
    try {
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
      const errorText = await page.$eval('[data-testid="error-message"]', el => el.textContent);
      logWithTimestamp(`Error message found: "${errorText}"`);
    } catch (e) {
      logWithTimestamp('Error message NOT found');
    }
    
    // Take error screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'chart-error-test.png'), fullPage: true });
    logWithTimestamp('Error test screenshot captured');
    
    // Save summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      browserVersion: await browser.version(),
      consoleMessages: consoleMessages,
      requests: requests,
      chartDiagnostics: chartDiagnostics,
      testResults: {
        simpleChartPage: {
          loaded: true,
          chartContainerFound: chartDiagnostics.chartContainerExists,
          canvasElementsFound: canvasElements.length
        },
        fullTestPage: {
          loaded: true,
          chartContainersFound: chartContainers.length,
          loadingIndicatorsFound: loadingIndicators.length,
          canvasElementsFound: testPageCanvasElements.length
        }
      }
    };
    
    fs.writeFileSync(
      path.join(screenshotsDir, 'chart-diagnostics-report.json'), 
      JSON.stringify(summaryReport, null, 2)
    );
    logWithTimestamp('Diagnostic report saved');
    
    // Wait for manual inspection
    logWithTimestamp('Waiting for 20 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    logWithTimestamp(`ERROR during testing: ${error.message}`);
    console.error(error);
  } finally {
    // Close the browser
    await browser.close();
    logWithTimestamp('Browser closed. Diagnostics complete.');
    
    // Print summary
    logWithTimestamp('DIAGNOSTICS SUMMARY:');
    logWithTimestamp(`- Screenshots and reports saved to: ${screenshotsDir}`);
    logWithTimestamp(`- Total console messages: ${consoleMessages.length}`);
    logWithTimestamp(`- Console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    logWithTimestamp(`- Network requests: ${requests.length}`);
  }
})();
