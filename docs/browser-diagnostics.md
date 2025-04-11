# Browser Diagnostics for Trend2Zero

This document explains how to use the browser diagnostics tools to catch and fix browser compatibility issues before they cause problems in production.

## Overview

The Trend2Zero project includes a pre-commit and pre-push hook that runs browser diagnostics to check for common browser compatibility issues. This helps catch issues early in the development process, especially for components that rely on browser-specific APIs like charts.

## How It Works

1. **Pre-Commit Hook**: Before each commit, the browser diagnostics script runs to check for common issues in the codebase.
2. **Pre-Push Hook**: Before pushing to the remote repository, the browser diagnostics script runs again to ensure all issues are fixed.
3. **Manual Diagnostics**: You can also run the browser diagnostics manually using the `npm run browser:diagnose` command.

## What It Checks

The browser diagnostics script checks for:

1. **Browser API Usage**: Ensures that browser-specific APIs like `document` and `window` are used safely with proper checks for SSR environments.
2. **Component-Specific Issues**: Checks for known issues in specific components like `TradingViewLightweightChart`.
3. **Playwright Tests**: Runs Playwright tests to ensure components render correctly in different browsers.
4. **Visual Inspection**: Opens components in the browser for visual inspection.

## Requirements

- **Browser Tools MCP**: The script uses the Browser Tools MCP server for browser automation. It will be installed automatically if not already present.
- **Development Server**: The script requires the development server to be running (`npm run dev`).
- **Playwright**: The script uses Playwright for browser testing.

## Usage

### Automatic Checks

The browser diagnostics run automatically:

- When you commit code (`git commit`)
- When you push code (`git push`)

### Manual Checks

You can also run the browser diagnostics manually:

```bash
npm run browser:diagnose
```

### Skipping Checks

In rare cases, you may need to skip the browser diagnostics:

```bash
git commit --no-verify
git push --no-verify
```

**Note**: Skipping checks should be done only in exceptional circumstances, as it bypasses important safeguards.

## Troubleshooting

### Common Issues

1. **Development Server Not Running**: If you see an error about the development server not running, start it with `npm run dev`.
2. **Browser Tools MCP Not Found**: If the Browser Tools MCP server fails to start, try installing it manually with `npm install -g @agentdeskai/browser-tools-mcp`.
3. **Playwright Tests Failing**: If Playwright tests fail, check the test output for details and fix the issues in the relevant components.

### Getting Help

If you encounter issues with the browser diagnostics, check:

1. The console output for specific error messages
2. The browser console for JavaScript errors
3. The Playwright test results for test failures

## Adding New Components to Check

To add a new component to the browser diagnostics:

1. Open `scripts/browser-diagnostics.js`
2. Add the component path to the `COMPONENTS_TO_CHECK` array
3. Add any component-specific checks to the `checkComponent` function

## Creating Test Pages

For each component that needs browser testing:

1. Create a test page in `app/test/[component-name]/page.tsx`
2. Add Playwright tests in `tests/[component-name].spec.js`

This allows the browser diagnostics to test the component in isolation.
