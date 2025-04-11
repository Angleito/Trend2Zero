/**
 * Diagnose Strapi Migration Issues
 * 
 * This script uses the Browser Tools MCP server to diagnose and fix issues
 * with Strapi migration.
 * 
 * Usage:
 * node scripts/diagnose-strapi.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const MCP_SERVER_URL = 'http://127.0.0.1:3025';

// Check if MCP server is running
async function checkMCPServer() {
  try {
    const response = await axios.get(`${MCP_SERVER_URL}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Start MCP server if not running
async function startMCPServer() {
  console.log('Starting Browser Tools MCP server...');
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

// Check Strapi API connection
async function checkStrapiConnection() {
  try {
    const response = await axios.get(`${STRAPI_API_URL}/api/ping`, {
      headers: STRAPI_API_TOKEN ? {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      } : {}
    });
    
    console.log('Strapi connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Strapi connection failed:', error.message);
    
    // Check if Strapi is running
    console.log('Checking if Strapi is running...');
    try {
      await axios.get(STRAPI_API_URL);
      console.log('Strapi is running but API endpoint is not accessible.');
    } catch (serverError) {
      console.error('Strapi server is not running or not accessible.');
    }
    
    return false;
  }
}

// Check Strapi content types
async function checkContentTypes() {
  if (!STRAPI_API_TOKEN) {
    console.error('STRAPI_API_TOKEN is required to check content types.');
    return false;
  }
  
  try {
    const response = await axios.get(`${STRAPI_API_URL}/api/content-type-builder/content-types`, {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      }
    });
    
    const contentTypes = response.data.data;
    console.log('Available content types:', contentTypes.map(ct => ct.uid).join(', '));
    
    // Check for required content types
    const requiredTypes = ['api::blog-post.blog-post', 'api::asset.asset', 'api::market-overview.market-overview'];
    const missingTypes = requiredTypes.filter(type => !contentTypes.some(ct => ct.uid === type));
    
    if (missingTypes.length > 0) {
      console.error('Missing required content types:', missingTypes.join(', '));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check content types:', error.message);
    return false;
  }
}

// Open Strapi admin in browser using MCP
async function openStrapiAdmin() {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/browser/open`, {
      url: `${STRAPI_API_URL}/admin`
    });
    
    console.log('Opened Strapi admin in browser.');
    return true;
  } catch (error) {
    console.error('Failed to open Strapi admin in browser:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting Strapi migration diagnosis...');
  
  // Check if MCP server is running
  let mcpRunning = await checkMCPServer();
  if (!mcpRunning) {
    mcpRunning = await startMCPServer();
    if (!mcpRunning) {
      console.error('Cannot proceed without MCP server.');
      process.exit(1);
    }
  }
  
  // Check Strapi connection
  const strapiConnected = await checkStrapiConnection();
  if (!strapiConnected) {
    console.log('Would you like to start Strapi? (y/n)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y') {
        console.log('Starting Strapi...');
        const strapiProcess = spawn('npm', ['run', 'strapi:dev'], {
          stdio: 'inherit'
        });
        
        // Wait for Strapi to start
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check connection again
        const reconnected = await checkStrapiConnection();
        if (reconnected) {
          await continueWithDiagnosis();
        }
      } else {
        console.log('Please start Strapi manually and run this script again.');
        process.exit(0);
      }
    });
  } else {
    await continueWithDiagnosis();
  }
}

async function continueWithDiagnosis() {
  // Check content types
  const contentTypesOk = await checkContentTypes();
  
  if (!contentTypesOk) {
    console.log('Would you like to open Strapi admin to create missing content types? (y/n)');
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y') {
        await openStrapiAdmin();
        console.log('\nPlease create the following content types in Strapi:');
        console.log('1. Blog Post (API ID: blog-post)');
        console.log('   - Fields: title (Text), content (Rich Text), slug (Text), excerpt (Text), author (Text), category (Text), publishedAt (Date)');
        console.log('2. Asset (API ID: asset)');
        console.log('   - Fields: name (Text), symbol (Text), assetType (Text), description (Text), currentPrice (Number), priceChange (Number), priceChangePercent (Number), marketCap (Number), volume24h (Number), lastUpdated (Date)');
        console.log('3. Market Overview (API ID: market-overview)');
        console.log('   - Fields: marketStatus (Text), lastUpdated (Date), marketSummary (Text), indices (JSON), topMovers (JSON)');
        console.log('\nAfter creating the content types, run the migration script:');
        console.log('npm run migrate:strapi');
      } else {
        console.log('Please create the required content types manually and run the migration script again.');
      }
    });
  } else {
    console.log('All required content types exist. You can run the migration script:');
    console.log('npm run migrate:strapi');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
