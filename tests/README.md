# Visual Regression Testing

## Overview
This project uses Playwright for visual regression testing of the home page. The tests are designed to:
- Capture screenshots across different viewport sizes
- Compare screenshots with reference images
- Detect console errors
- Check for layout shifts
- Ensure page performance and accessibility

## Running Visual Tests

### Prerequisites
- Node.js (version 18.0.0 or higher)
- Playwright installed (`npm install @playwright/test`)

### Available Commands
- `npm run test:visual`: Run visual regression tests
- `npm run test:visual:update`: Update reference screenshots
- `npm run test:visual:report`: Open the latest test report

## Test Configuration
- Tested viewports: Mobile, Tablet, Desktop, Large Desktop
- Screenshot comparison threshold: 1% pixel difference
- Console error detection
- Layout shift monitoring

## Troubleshooting
- Ensure the development server is running before tests
- Use `test:visual:update` to regenerate reference screenshots
- Check the Playwright report for detailed test results

## Best Practices
- Commit reference screenshots to version control
- Regularly update reference images to reflect design changes
- Review test failures carefully to distinguish between actual issues and expected updates