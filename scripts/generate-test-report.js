const fs = require('fs');
const path = require('path');

function generateTestReport(timestamp) {
  // Directories
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  const reportsDir = path.join(testResultsDir, 'reports');
  const logsDir = path.join(testResultsDir, 'logs');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Collect test results from different sources
  const testResults = {
    timestamp: timestamp,
    unitTests: {},
    e2eTests: {},
    coverageReport: {},
    mcpLogs: {},
    performanceMetrics: {}
  };

  // Read Jest coverage report
  try {
    const coveragePath = path.join(testResultsDir, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      testResults.coverageReport = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading coverage report:', error);
  }

  // Read Playwright test results
  try {
    const playwrightReportPath = path.join(testResultsDir, 'test-results.json');
    if (fs.existsSync(playwrightReportPath)) {
      testResults.e2eTests = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading Playwright test results:', error);
  }

  // Read MCP log analysis
  try {
    const mcpLogPath = path.join(logsDir, 'mcp-log-summary.json');
    if (fs.existsSync(mcpLogPath)) {
      testResults.mcpLogs = JSON.parse(fs.readFileSync(mcpLogPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading MCP logs:', error);
  }

  // Analyze performance metrics
  try {
    const performanceLogPath = path.join(logsDir, 'performance-metrics.json');
    if (fs.existsSync(performanceLogPath)) {
      testResults.performanceMetrics = JSON.parse(fs.readFileSync(performanceLogPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading performance metrics:', error);
  }

  // Generate comprehensive HTML report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Trend2Zero Test Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .section { background: #f4f4f4; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Trend2Zero Test Report</h1>
    <p>Generated: ${new Date(timestamp).toLocaleString()}</p>

    <div class="section">
        <h2>Coverage Report</h2>
        <pre>${JSON.stringify(testResults.coverageReport, null, 2)}</pre>
    </div>

    <div class="section">
        <h2>E2E Test Results</h2>
        <pre>${JSON.stringify(testResults.e2eTests, null, 2)}</pre>
    </div>

    <div class="section">
        <h2>MCP Log Analysis</h2>
        <pre>${JSON.stringify(testResults.mcpLogs, null, 2)}</pre>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <pre>${JSON.stringify(testResults.performanceMetrics, null, 2)}</pre>
    </div>
</body>
</html>
  `;

  // Write HTML report
  const reportPath = path.join(reportsDir, `test-report-${timestamp}.html`);
  fs.writeFileSync(reportPath, htmlReport);

  // Write JSON report for machine parsing
  const jsonReportPath = path.join(reportsDir, `test-report-${timestamp}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(testResults, null, 2));

  console.log(`Test report generated: ${reportPath}`);
  return testResults;
}

// Allow script to be run directly or imported
if (require.main === module) {
  const timestamp = process.argv[2] || new Date().toISOString();
  generateTestReport(timestamp);
}

module.exports = generateTestReport;