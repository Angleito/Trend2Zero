#!/usr/bin/env node

/**
 * Test Vercel Deployment
 * 
 * This script uses browser tools to test the Vercel deployment of the Trend2Zero project.
 * It checks if the site is accessible and if the TradingViewLightweightChart component
 * is rendering correctly.
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_DEPLOYMENT_URL = 'https://trend2zero.vercel.app'; // Update this with your actual Vercel deployment URL
const MCP_SERVER_URL = 'http://127.0.0.1:3025';
const BROWSER_TOOLS_PACKAGE = '@agentdeskai/browser-tools-mcp';
const PAGES_TO_CHECK = [
  '/',
  '/test/tradingviewlightweightchart',
  '/market'
];

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

// Check if a URL is accessible
async function checkURL(url) {
  try {
    console.log(`Checking URL: ${url}`);
    const response = await axios.get(url);
    return response.status === 200;
  } catch (error) {
    console.error(`Error accessing ${url}:`, error.message);
    return false;
  }
}

// Open URL in browser for visual inspection
async function openURLInBrowser(url) {
  try {
    console.log(`Opening URL in browser: ${url}`);
    
    // Use MCP to open browser
    await axios.post(`${MCP_SERVER_URL}/browser/open`, {
      url
    });
    
    console.log(`Please visually inspect the page at ${url}`);
    console.log('Press Enter when done...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to open ${url} in browser:`, error.message);
    return false;
  }
}

// Take a screenshot of a page
async function takeScreenshot(url, filename) {
  try {
    console.log(`Taking screenshot of ${url}`);
    
    // Use MCP to take screenshot
    const response = await axios.post(`${MCP_SERVER_URL}/browser/screenshot`, {
      url,
      options: {
        fullPage: true
      }
    });
    
    // Save screenshot
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotDir, filename);
    fs.writeFileSync(screenshotPath, Buffer.from(response.data.screenshot, 'base64'));
    
    console.log(`Screenshot saved to ${screenshotPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to take screenshot of ${url}:`, error.message);
    return false;
  }
}

// Check for JavaScript errors on a page
async function checkForJSErrors(url) {
  try {
    console.log(`Checking for JavaScript errors on ${url}`);
    
    // Use MCP to check for JS errors
    const response = await axios.post(`${MCP_SERVER_URL}/browser/evaluate`, {
      url,
      script: `
        // Return any errors from the console
        const errors = [];
        const originalConsoleError = console.error;
        console.error = function() {
          errors.push(Array.from(arguments).join(' '));
          originalConsoleError.apply(console, arguments);
        };
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return errors;
      `
    });
    
    const errors = response.data.result;
    if (errors && errors.length > 0) {
      console.error(`JavaScript errors found on ${url}:`);
      errors.forEach(error => console.error(`- ${error}`));
      return false;
    }
    
    console.log(`No JavaScript errors found on ${url}`);
    return true;
  } catch (error) {
    console.error(`Failed to check for JavaScript errors on ${url}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log(`Testing Vercel deployment at ${VERCEL_DEPLOYMENT_URL}...`);
  
  // Check if site is accessible
  const siteAccessible = await checkURL(VERCEL_DEPLOYMENT_URL);
  if (!siteAccessible) {
    console.error(`Site is not accessible at ${VERCEL_DEPLOYMENT_URL}`);
    process.exit(1);
  }
  
  console.log(`Site is accessible at ${VERCEL_DEPLOYMENT_URL}`);
  
  // Start MCP server if not running
  const mcpRunning = await checkMCPServer() || await startMCPServer();
  if (!mcpRunning) {
    console.error('Cannot proceed without MCP server.');
    process.exit(1);
  }
  
  // Check each page
  let allPagesValid = true;
  for (const page of PAGES_TO_CHECK) {
    const pageURL = `${VERCEL_DEPLOYMENT_URL}${page}`;
    
    // Check if page is accessible
    const pageAccessible = await checkURL(pageURL);
    if (!pageAccessible) {
      console.error(`Page is not accessible: ${pageURL}`);
      allPagesValid = false;
      continue;
    }
    
    // Take screenshot
    const filename = `${page.replace(/\//g, '-').replace(/^-/, '')}.png`;
    await takeScreenshot(pageURL, filename || 'home.png');
    
    // Check for JavaScript errors
    const noJSErrors = await checkForJSErrors(pageURL);
    if (!noJSErrors) {
      allPagesValid = false;
    }
    
    // Open page in browser for visual inspection
    await openURLInBrowser(pageURL);
  }
  
  // Final result
  if (!allPagesValid) {
    console.error('\n❌ Vercel deployment test failed. Please fix the issues.');
    process.exit(1);
  }
  
  console.log('\n✅ Vercel deployment test passed. All pages are working correctly.');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
