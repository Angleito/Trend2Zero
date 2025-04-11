# Browser Diagnostic Scripts

## Overview

These diagnostic scripts provide interactive, visual debugging for various components and pages in the Trend2Zero application. Unlike traditional headless testing, these scripts launch a visible browser window, allowing developers to inspect rendering, interactions, and error states in real-time.

## Available Diagnostic Scripts

Each diagnostic script follows a consistent pattern:
- Launches a browser in headed mode
- Navigates to a specific test page
- Takes screenshots at different stages
- Captures and logs console errors
- Checks for specific elements and their presence
- Provides a 10-second window for visual inspection

### Available Scripts

1. **Chart Diagnostics**
   ```bash
   npm run diagnostic:chart
   ```
   Tests the TradingViewLightweightChart component, checking chart rendering and error handling.

2. **Bitcoin Ticker Diagnostics**
   ```bash
   npm run diagnostic:bitcoin-ticker
   ```
   Diagnoses the Bitcoin Ticker component, verifying price display and error states.

3. **Market Overview Diagnostics**
   ```bash
   npm run diagnostic:market-overview
   ```
   Checks the Market Overview page for proper rendering of asset lists and performance indicators.

4. **Asset Price Converter Diagnostics**
   ```bash
   npm run diagnostic:asset-price-converter
   ```
   Tests the Asset Price Converter for correct conversion inputs, results, and error handling.

5. **Tracker Page Diagnostics**
   ```bash
   npm run diagnostic:tracker
   ```
   Verifies the Tracker page's watchlist, asset tracking controls, and performance summary.

## How to Use

1. Ensure your development server is running (`npm run dev`)
2. Open a new terminal
3. Run the desired diagnostic script
4. Observe the browser window and console output

## Diagnostic Process

Each script does the following:
- Launches a non-headless (visible) browser
- Navigates to the test page
- Takes initial screenshots
- Checks for specific elements
- Captures console errors
- Provides a 10-second window for manual inspection
- Automatically closes the browser

## Customization

The diagnostic scripts are based on a flexible template (`browser-diagnostic-template.js`) that can be easily extended or modified to support new components or testing scenarios.

## Best Practices

- Use these scripts during development to catch rendering issues early
- Pay attention to console errors and screenshots
- If an issue is found, use the browser's developer tools for further investigation
