const { runBrowserDiagnostics } = require('./browser-diagnostic-template');

// Diagnostic script for Bitcoin Ticker
(async () => {
  await runBrowserDiagnostics('http://localhost:3000/test/bitcoin-ticker', {
    screenshotPrefix: 'bitcoin-ticker',
    waitForSelector: '.bitcoin-price-display',
    checkElements: [
      { selector: '.bitcoin-price-display', type: 'exists' },
      { selector: '.price-change-percentage', type: 'exists' },
      { selector: '.bitcoin-chart', type: 'exists' }
    ]
  });

  // Error mode diagnostic
  await runBrowserDiagnostics('http://localhost:3000/test/bitcoin-ticker', {
    screenshotPrefix: 'bitcoin-ticker-error',
    errorMode: true,
    waitForSelector: '.error-message',
    checkElements: [
      { selector: '.error-message', type: 'exists' }
    ]
  });
})();