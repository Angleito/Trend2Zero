# Vercel Build and Debugging Toolkit

## Overview
This toolkit provides a comprehensive solution for Vercel build debugging, browser testing, and performance optimization using Puppeteer, Playwright, and advanced diagnostic tools.

## Features
- 🚀 Automated Vercel build simulation
- 🌐 Multi-browser testing (Chrome, Firefox, Safari)
- 📱 Mobile and desktop browser compatibility
- 🔍 Performance and accessibility audits
- 📊 Detailed test reporting
- 🛠️ Configurable test environments

## Prerequisites
- Node.js 18+
- npm 9+
- Vercel CLI (optional)

## Installation
```bash
npm install
```

## Configuration Files
- `scripts/vercel-build-config.json`: Test environment and performance settings
- `playwright.config.ts`: Playwright test configuration
- `scripts/mock-vercel-build.sh`: Vercel build simulation script
- `scripts/vercel-build-debug.js`: Advanced browser testing and debugging script

## Available Scripts
- `npm run build`: Run Vercel build simulation
- `npm run test:debug`: Execute comprehensive browser debugging
- `npm run test:puppeteer`: Run Puppeteer tests
- `npm run test:playwright`: Run Playwright tests
- `npm run test:coverage`: Generate test coverage report

## Debugging Workflow
1. Configure test parameters in `vercel-build-config.json`
2. Run `npm run test:debug`
3. Inspect results in `test-results/` directory

## Performance Thresholds
- First Contentful Paint: < 1.5s
- Speed Index: < 1.8s
- Time to Interactive: < 3.5s
- Total Blocking Time: < 300ms

## Troubleshooting
- Ensure all environment variables are set
- Check network connectivity
- Verify browser dependencies are installed

## Contributing
Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the `LICENSE` file for details.