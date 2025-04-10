const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function globalTeardown() {
  // Logging function
  const log = (message, level = 'info') => {
    const logPath = path.join(__dirname, '..', 'test-results', 'logs', 'global-teardown.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}\n`;

    fs.appendFileSync(logPath, logMessage);
    console.log(logMessage.trim());
  };

  try {
    log('Starting global teardown for Trend2Zero tests');

    // Ensure test results directory exists
    const resultsDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Compress logs if log files exist
    const compressLogs = () => {
      const logsDir = path.join(resultsDir, 'logs');
      const archivesDir = path.join(resultsDir, 'archives');

      // Ensure archives directory exists
      if (!fs.existsSync(archivesDir)) {
        fs.mkdirSync(archivesDir, { recursive: true });
      }

      try {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const archiveName = `test-logs-${timestamp}.tar.gz`;
        const archivePath = path.join(archivesDir, archiveName);

        // Only compress if log files exist
        const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
        if (logFiles.length > 0) {
          execSync(`tar -czvf ${archivePath} -C ${logsDir} .`);
          log(`Logs archived to ${archivePath}`);
        } else {
          log('No log files to compress', 'warn');
        }
      } catch (compressError) {
        log(`Failed to compress logs: ${compressError.message}`, 'error');
      }
    };

    // Analyze test results
    const analyzeTestResults = () => {
      try {
        const resultsPath = path.join(resultsDir, 'test-results.json');

        // Create a basic results file if it doesn't exist
        if (!fs.existsSync(resultsPath)) {
          const defaultResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0
          };
          fs.writeFileSync(resultsPath, JSON.stringify(defaultResults, null, 2));
        }

        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        const summaryPath = path.join(resultsDir, 'logs', 'test-summary.txt');

        fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
        log('Test summary generated');
      } catch (resultError) {
        log(`Failed to analyze test results: ${resultError.message}`, 'error');
      }
    };

    // Clean up browser and test-related processes
    const cleanupProcesses = () => {
      try {
        // Skip process cleanup in CI environment
        if (process.env.CI) {
          log('Skipping process cleanup in CI environment');
          return;
        }

        // Only kill browser processes related to testing
        const processesToKill = [
          'chromium.*playwright',
          'firefox.*playwright',
          'webkit.*playwright'
        ];

        processesToKill.forEach(process => {
          try {
            // Use a more specific pattern to avoid killing unrelated processes
            if (process.platform === 'win32') {
              // Windows-specific process killing (not implemented)
              log(`Skipping process cleanup for ${process} on Windows`, 'warn');
            } else {
              // Unix-based process killing
              execSync(`pkill -f "${process}" || true`);
            }
          } catch (killError) {
            // Ignore errors if process is not found
            log(`Could not kill ${process} processes`, 'warn');
          }
        });

        log('Cleanup of test-related browser processes completed');
      } catch (cleanupError) {
        log(`Process cleanup failed: ${cleanupError.message}`, 'error');
      }
    };

    // Run cleanup tasks
    compressLogs();
    analyzeTestResults();
    cleanupProcesses();

    log('Global teardown completed successfully');
  } catch (error) {
    log(`Global teardown failed: ${error.message}`, 'error');
    throw error;
  }
}

module.exports = globalTeardown;
