# Browser Debugging and MCP Server Testing Infrastructure

## Overview
This directory contains advanced testing and debugging configurations for the Trend2Zero project, leveraging Playwright, MCP (Model Context Protocol) servers, and comprehensive logging mechanisms.

## Key Components

### 1. Global Setup and Teardown
- `global-setup.js`: Initializes testing environment
  - Creates logging directories
  - Starts MCP server logging
  - Launches diagnostic browser
  - Captures initial console logs

- `global-teardown.js`: Handles post-test cleanup and analysis
  - Compresses test logs
  - Generates test result summaries
  - Cleans up browser and MCP server processes
  - Optional: Sends test results to monitoring service

### 2. Debugging Configuration
The testing infrastructure provides multiple debugging capabilities:

#### Browser Debugging
- Headless mode disabled for visual inspection
- Detailed console and network logging
- Screenshot and video capture for all tests
- Trace capturing for comprehensive debugging

#### MCP Server Logging
- Separate log files for MCP server operations
- Error tracking and critical issue identification
- Performance and connectivity monitoring

## Running Tests

### Standard E2E Tests
```bash
npm run test:e2e
```

### Debug Mode Tests
```bash
npm run test:e2e:debug
```

### Analyze MCP Logs
```bash
npm run test:mcp:logs
```

## Log Locations
- Test Results: `test-results/`
  - `logs/`: Detailed log files
  - `videos/`: Test execution videos
  - `traces/`: Playwright execution traces
  - `screenshots/`: Captured screenshots
  - `archives/`: Compressed log archives

## Debugging Best Practices
1. Always run tests in debug mode when investigating issues
2. Review log files in `test-results/logs/`
3. Check video recordings for visual debugging
4. Use trace files for detailed step-by-step analysis

## Troubleshooting
- Ensure all MCP server dependencies are installed
- Check network connectivity
- Verify API keys and authentication
- Review `mcp-log-summary.json` for potential issues

## Configuration Files
- `playwright.config.js`: Comprehensive test configuration
- `global-setup.js`: Test environment initialization
- `global-teardown.js`: Post-test cleanup and analysis
- `analyze-mcp-logs.js`: Log analysis script

## Contributing
When adding new tests or debugging features:
- Update logging mechanisms
- Add detailed error handling
- Ensure comprehensive log capture
- Document any new debugging techniques

## Security
- API keys and sensitive information are not committed to version control
- Logs are stored locally and can be configured for secure transmission