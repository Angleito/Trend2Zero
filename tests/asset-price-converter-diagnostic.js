const { runBrowserDiagnostics } = require('./browser-diagnostic-template');

// Diagnostic script for Asset Price Converter
(async () => {
  await runBrowserDiagnostics('http://localhost:3000/test/asset-price-converter', {
    screenshotPrefix: 'asset-price-converter',
    waitForSelector: 'h1:has-text("Asset Price Converter")',
    checkElements: [
      { selector: '.conversion-input', type: 'exists' },
      { selector: '.conversion-result', type: 'exists' },
      { selector: '.currency-select', type: 'count', expectedCount: 2 }
    ]
  });

  // Error mode diagnostic
  await runBrowserDiagnostics('http://localhost:3000/test/asset-price-converter', {
    screenshotPrefix: 'asset-price-converter-error',
    errorMode: true,
    waitForSelector: '.error-message',
    checkElements: [
      { selector: '.error-message', type: 'exists' }
    ]
  });
})();