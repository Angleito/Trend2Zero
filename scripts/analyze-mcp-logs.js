const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}`;
  
  // Console output
  console.log(logMessage);
  
  // File logging
  const logDir = path.join(__dirname, '..', 'test-results', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFilePath = path.join(logDir, 'mcp-log-analysis.log');
  fs.appendFileSync(logFilePath, logMessage + '\n');
}

function analyzeMcpLogs() {
  const logDir = path.join(__dirname, '..', 'test-results', 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    log('Log directory not found. Creating...', 'warn');
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Log files to analyze
  const logFiles = [
    'mcp-server.log',
    'mcp-server-errors.log',
    'browser-console.log'
  ];

  // Analysis results
  const analysisResults = {
    timestamp: new Date().toISOString(),
    files: {}
  };

  logFiles.forEach(fileName => {
    const filePath = path.join(logDir, fileName);
    
    try {
      if (!fs.existsSync(filePath)) {
        log(`Log file not found: ${fileName}`, 'warn');
        return;
      }

      const logContent = fs.readFileSync(filePath, 'utf8');
      
      // Basic log analysis
      const analysis = {
        totalLines: logContent.split('\n').length,
        errorCount: (logContent.match(/error/gi) || []).length,
        warningCount: (logContent.match(/warning/gi) || []).length,
        criticalIssues: []
      };

      // Identify critical issues
      const criticalPatterns = [
        /failed to connect/i,
        /timeout/i,
        /unexpected error/i,
        /cannot resolve/i
      ];

      criticalPatterns.forEach(pattern => {
        const matches = logContent.match(new RegExp(pattern, 'gi')) || [];
        if (matches.length > 0) {
          analysis.criticalIssues.push({
            pattern: pattern.toString(),
            count: matches.length
          });
        }
      });

      analysisResults.files[fileName] = analysis;
      log(`Analyzed ${fileName}: ${JSON.stringify(analysis)}`, 'info');
    } catch (error) {
      log(`Error analyzing ${fileName}: ${error.message}`, 'error');
    }
  });

  // Generate summary report
  const summaryReportPath = path.join(logDir, 'mcp-log-summary.json');
  fs.writeFileSync(summaryReportPath, JSON.stringify(analysisResults, null, 2));

  log('MCP Log Analysis Complete', 'info');
  return analysisResults;
}

// Run analysis
try {
  const results = analyzeMcpLogs();
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
} catch (error) {
  log(`Fatal error in MCP log analysis: ${error.message}`, 'error');
  process.exit(1);
}