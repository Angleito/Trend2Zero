#!/usr/bin/env node

/**
 * Browser Diagnostics Script
 * 
 * This script uses browser tools to diagnose potential issues with Playwright and Vercel
 * before committing code. It checks for common browser compatibility issues and
 * validates components like TradingViewLightweightChart.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Configuration
const MCP_SERVER_URL = 'http://127.0.0.1:3025';
const COMPONENTS_TO_CHECK = [
  'components/TradingViewLightweightChart.tsx'
];
const BROWSER_TOOLS_PACKAGE = '@agentdeskai/browser-tools-mcp';

// Check if MCP server is running
async function checkMCPServer() {
  try {
    console.log('Checking MCP server at', MCP_SERVER_URL);
    const response = await axios.get(`${MCP_SERVER_URL}/server-info`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Start MCP server if not running
async function startMCPServer() {
  console.log('Starting Browser Tools MCP server...');
  
  // Check if browser-tools-mcp is installed
  try {
    require.resolve(BROWSER_TOOLS_PACKAGE);
  } catch (e) {
    console.log('Browser Tools MCP not found. Installing...');
    await new Promise((resolve, reject) => {
      const install = spawn('npm', ['install', '-g', BROWSER_TOOLS_PACKAGE], {
        stdio: 'inherit'
      });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('Browser Tools MCP installed successfully.');
          resolve();
        } else {
          console.error(`Failed to install Browser Tools MCP with code ${code}`);
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
    });
  }
  
  const mcpServer = spawn('browser-tools-mcp', [], {
    detached: true,
    stdio: 'ignore'
  });
  
  mcpServer.unref();
  
  // Wait for server to start
  let attempts = 0;
  while (attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isRunning = await checkMCPServer();
    if (isRunning) {
      console.log('Browser Tools MCP server is running.');
      return true;
    }
    attempts++;
  }
  
  console.error('Failed to start Browser Tools MCP server.');
  return false;
}

// Check component for browser compatibility issues
async function checkComponent(componentPath) {
  console.log(`Checking component: ${componentPath}`);
  
  if (!fs.existsSync(componentPath)) {
    console.error(`Component file not found: ${componentPath}`);
    return false;
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  
  // Check for common issues
  const issues = [];
  
  // Check for browser-specific APIs without fallbacks
  if (content.includes('document.') && !content.includes('typeof document !== "undefined"')) {
    issues.push('Using document API without checking if it exists (will fail in SSR)');
  }
  
  if (content.includes('window.') && !content.includes('typeof window !== "undefined"')) {
    issues.push('Using window API without checking if it exists (will fail in SSR)');
  }
  
  // Check for lightweight-charts specific issues
  if (componentPath.includes('TradingViewLightweightChart')) {
    if (content.includes('chart.addSeries(')) {
      issues.push('Using chart.addSeries() instead of chart.addLineSeries() or other specific methods');
    }
    
    if (content.includes('PriceLineSource.Last')) {
      issues.push('Using PriceLineSource.Last which may not exist in the current version');
    }
  }
  
  // Report issues
  if (issues.length > 0) {
    console.error(`\nIssues found in ${componentPath}:`);
    issues.forEach(issue => console.error(`- ${issue}`));
    return false;
  }
  
  console.log(`✅ No issues found in ${componentPath}`);
  return true;
}

// Run Playwright tests
async function runPlaywrightTests() {
  console.log('\nRunning Playwright tests...');
  
  return new Promise((resolve) => {
    const playwright = spawn('npx', ['playwright', 'test'], {
      stdio: 'inherit'
    });
    
    playwright.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Playwright tests passed');
        resolve(true);
      } else {
        console.error(`❌ Playwright tests failed with code ${code}`);
        resolve(false);
      }
    });
  });
}

// Open component in browser for visual inspection
async function openComponentInBrowser(componentName) {
  try {
    // Get the development server URL
    const devUrl = 'http://localhost:3000';
    
    // Extract component name without extension and path
    const name = path.basename(componentName, path.extname(componentName));
    
    // Construct URL to view the component
    const componentUrl = `${devUrl}/test/${name.toLowerCase()}`;
    
    console.log(`\nOpening component in browser: ${componentUrl}`);
    
    // Use MCP to open browser
    await axios.post(`${MCP_SERVER_URL}/browser/open`, {
      url: componentUrl
    });
    
    console.log('Please visually inspect the component in the browser.');
    console.log('Press Enter when done...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    return true;
  } catch (error) {
    console.error('Failed to open component in browser:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Running browser diagnostics before commit...');
  
  // Check if dev server is running
  try {
    await axios.get('http://localhost:3000');
  } catch (error) {
    console.error('Development server is not running. Please start it with "npm run dev"');
    process.exit(1);
  }
  
  // Start MCP server if not running
  const mcpRunning = await checkMCPServer() || await startMCPServer();
  if (!mcpRunning) {
    console.error('Cannot proceed without MCP server.');
    process.exit(1);
  }
  
  // Check components
  let allComponentsValid = true;
  for (const component of COMPONENTS_TO_CHECK) {
    const isValid = await checkComponent(component);
    if (!isValid) {
      allComponentsValid = false;
    }
  }
  
  // Run Playwright tests if components are valid
  let testsPass = true;
  if (allComponentsValid) {
    testsPass = await runPlaywrightTests();
  }
  
  // Open components in browser for visual inspection
  if (allComponentsValid && testsPass) {
    for (const component of COMPONENTS_TO_CHECK) {
      await openComponentInBrowser(component);
    }
  }
  
  // Final result
  if (!allComponentsValid || !testsPass) {
    console.error('\n❌ Browser diagnostics failed. Please fix the issues before committing.');
    process.exit(1);
  }
  
  console.log('\n✅ Browser diagnostics passed. You can proceed with your commit.');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
