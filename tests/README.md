# Trend2Zero Testing Infrastructure

## Overview
This directory contains a comprehensive, low-disruption testing infrastructure for the Trend2Zero project, designed to minimize browser interaction and system resource usage.

## Testing Frameworks
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end (E2E) and browser testing
- **MCP (Model Context Protocol)**: Advanced debugging and logging

## Testing Modes

### 1. Minimal Disruption (Recommended)
```bash
# Run E2E tests in background
npm run test:e2e
```
- Headless browser testing
- No visual browser windows
- Minimal system resource consumption

### 2. Verbose Debugging
```bash
# Detailed test output
npm run test:e2e:verbose
```
- Provides comprehensive test logs
- Useful for detailed troubleshooting

### 3. Generate Test Report
```bash
# View generated test report
npm run test:e2e:report
```
- Opens HTML test report
- Detailed test result visualization

## Test Result Locations
- **Unit Test Coverage**: `test-results/coverage/`
- **E2E Test Videos**: `test-results/videos/`
- **Screenshots**: `test-results/screenshots/`
- **Logs**: `test-results/logs/`
- **Test Reports**: `test-results/reports/`

## Key Features
- Headless browser testing
- Minimal visual interference
- Comprehensive logging
- Performance-optimized test execution
- Automatic server management
- Cross-browser compatibility

## Logging and Diagnostics
- Detailed console and network logging
- Performance metric tracking
- Automated test report generation
- Error screenshot capture

## Performance Optimization
- Headless browser mode
- Minimal resource usage
- Background test execution
- Configurable test parallelization

## Troubleshooting
1. Check `test-results/logs/` for detailed error information
2. Review generated HTML reports in `test-results/reports/`
3. Examine screenshots for visual debugging

## Contributing
- Write tests in `tests/` directory
- Follow existing test structure
- Add meaningful logging
- Ensure cross-browser compatibility

## Best Practices
- Keep tests independent and atomic
- Use descriptive test names
- Add comprehensive error logging
- Test both happy paths and edge cases

## Advanced Configuration
Modify `playwright.config.js` to:
- Adjust browser settings
- Configure test timeouts
- Customize test reporting
- Fine-tune performance parameters