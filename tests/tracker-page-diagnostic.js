const { runBrowserDiagnostics } = require('./browser-diagnostic-template');

// Diagnostic script for Tracker Page
(async () => {
  await runBrowserDiagnostics('http://localhost:3000/tracker', {
    screenshotPrefix: 'tracker-page',
    waitForSelector: '.tracker-container',
    checkElements: [
      { selector: '.tracker-container', type: 'exists' },
      { selector: '.watchlist-section', type: 'exists' },
      { selector: '.asset-tracking-controls', type: 'exists' },
      { selector: '.performance-summary', type: 'exists' }
    ]
  });

  // Error mode diagnostic
  await runBrowserDiagnostics('http://localhost:3000/tracker', {
    screenshotPrefix: 'tracker-page-error',
    errorMode: true,
    waitForSelector: '.error-message',
    checkElements: [
      { selector: '.error-message', type: 'exists' }
    ]
  });
})();