const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  // Aggregate and compress test logs
  const logDir = path.join(__dirname, '..', 'test-results', 'logs');
  const archiveDir = path.join(__dirname, '..', 'test-results', 'archives');

  // Ensure archive directory exists
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Function to compress logs
  const compressLogs = () => {
    const { execSync } = require('child_process');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveName = `test-logs-${timestamp}.tar.gz`;
    const archivePath = path.join(archiveDir, archiveName);

    try {
      execSync(`tar -czvf ${archivePath} -C ${logDir} .`);
      console.log(`Logs archived to ${archivePath}`);
    } catch (error) {
      console.error('Failed to archive logs:', error);
    }
  };

  // Analyze and log test results
  const analyzeTestResults = () => {
    const resultsPath = path.join(__dirname, '..', 'test-results', 'test-results.json');
    
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      const summaryPath = path.join(logDir, 'test-summary.txt');
      
      const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      };

      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log('Test summary generated:', summary);
    } catch (error) {
      console.error('Failed to analyze test results:', error);
    }
  };

  // Clean up browser and MCP server resources
  const cleanupResources = () => {
    // Kill any lingering browser or MCP server processes
    try {
      const { execSync } = require('child_process');
      execSync('pkill -f "npx @agentdeskai/browser-tools-mcp"');
      execSync('pkill -f "chromium"');
    } catch (error) {
      console.error('Error during process cleanup:', error);
    }
  };

  // Run cleanup tasks
  compressLogs();
  analyzeTestResults();
  cleanupResources();

  // Optional: Send test results to monitoring service
  const reportTestResults = async () => {
    try {
      // Example: Send results to a monitoring service
      const axios = require('axios');
      const resultsPath = path.join(__dirname, '..', 'test-results', 'test-results.json');
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

      await axios.post('https://monitoring.example.com/test-results', {
        project: 'Trend2Zero',
        timestamp: new Date().toISOString(),
        results: results
      });
    } catch (error) {
      console.error('Failed to report test results:', error);
    }
  };

  // Wait for all async operations to complete
  await Promise.allSettled([
    reportTestResults()
  ]);
}

module.exports = globalTeardown;
