const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function globalSetup(config) {
  // Create logging directories
  const logDirs = [
    'test-results/logs',
    'test-results/traces',
    'test-results/screenshots'
  ];
  
  logDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Initialize MCP server logging
  const mcpLogFile = path.join(__dirname, '..', 'test-results', 'logs', 'mcp-server.log');
  const mcpErrorLogFile = path.join(__dirname, '..', 'test-results', 'logs', 'mcp-server-errors.log');
  
  // Write initial log headers
  fs.writeFileSync(mcpLogFile, `MCP Server Logs - ${new Date().toISOString()}\n\n`);
  fs.writeFileSync(mcpErrorLogFile, `MCP Server Error Logs - ${new Date().toISOString()}\n\n`);

  // Optional: Start MCP server logging process
  try {
    const { spawn } = require('child_process');
    const mcpServerProcess = spawn('npx', [
      '@agentdeskai/browser-tools-mcp@1.2.0', 
      '--log-file', mcpLogFile, 
      '--error-log-file', mcpErrorLogFile
    ]);

    mcpServerProcess.stdout.on('data', (data) => {
      fs.appendFileSync(mcpLogFile, data);
    });

    mcpServerProcess.stderr.on('data', (data) => {
      fs.appendFileSync(mcpErrorLogFile, data);
    });

    // Store process reference for potential later use
    global.mcpServerProcess = mcpServerProcess;
  } catch (error) {
    console.error('Failed to start MCP server logging:', error);
  }

  // Launch browser for initial diagnostics
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--enable-logging',
      '--v=1',
      '--no-sandbox',
      '--disable-web-security'
    ]
  });

  // Create a context for initial diagnostics
  const context = await browser.newContext({
    recordVideo: {
      dir: 'test-results/videos/diagnostics',
      size: { width: 1920, height: 1080 }
    }
  });

  // Create a page for initial diagnostics
  const page = await context.newPage();
  
  // Capture initial browser console logs
  page.on('console', msg => {
    const logFile = path.join(__dirname, '..', 'test-results', 'logs', 'browser-console.log');
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg.type()}: ${msg.text()}\n`);
  });

  // Optional: Navigate to a diagnostic page or perform initial checks
  try {
    await page.goto('about:blank');
  } catch (error) {
    console.error('Initial page navigation error:', error);
  }

  // Store browser and context for potential use in tests
  global.diagnosticBrowser = browser;
  global.diagnosticContext = context;
  global.diagnosticPage = page;

  return async () => {
    // Cleanup function
    if (global.diagnosticPage) await global.diagnosticPage.close();
    if (global.diagnosticContext) await global.diagnosticContext.close();
    if (global.diagnosticBrowser) await global.diagnosticBrowser.close();
    
    // Stop MCP server process if running
    if (global.mcpServerProcess) {
      global.mcpServerProcess.kill();
    }
  };
}
