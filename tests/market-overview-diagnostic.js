const { runBrowserDiagnostics } = require('./browser-diagnostic-template');

// Diagnostic script for Market Overview
(async () => {
  await runBrowserDiagnostics('http://localhost:3000/test/market-overview', {
    screenshotPrefix: 'market-overview',
    waitForSelector: '.market-overview-container',
    checkElements: [
      { selector: '.market-overview-container', type: 'exists' },
      { selector: '.top-assets-list', type: 'exists' },
      { selector: '.market-trend-indicators', type: 'exists' },
      { selector: '.asset-performance-chart', type: 'exists' }
    ]
  });

  // Error mode diagnostic
  await runBrowserDiagnostics('http://localhost:3000/test/market-overview', {
    screenshotPrefix: 'market-overview-error',
    errorMode: true,
    waitForSelector: '.error-message',
    checkElements: [
      { selector: '.error-message', type: 'exists' }
    ]
  });
})();