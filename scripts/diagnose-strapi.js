/**
 * Diagnose Strapi Migration Issues
 *
 * This script diagnoses issues with Strapi migration.
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

// Open Strapi admin in default browser
function openStrapiAdmin() {
  const url = `${STRAPI_API_URL}/admin`;
  console.log(`Opening Strapi admin at ${url}`);

  let command;
  switch (process.platform) {
    case 'darwin':
      command = 'open';
      break;
    case 'win32':
      command = 'start';
      break;
    default:
      command = 'xdg-open';
      break;
  }

  try {
    spawn(command, [url], { stdio: 'ignore' });
    console.log('Opened Strapi admin in browser.');
    return true;
  } catch (error) {
    console.error('Failed to open Strapi admin in browser:', error.message);
    console.log(`Please open ${url} manually in your browser.`);
    return false;
  }
}

// Check if Strapi is installed
async function checkStrapiInstallation() {
  const strapiBackendPath = path.join(__dirname, '../strapi-backend');

  if (!fs.existsSync(strapiBackendPath)) {
    console.log('Strapi backend directory not found. You need to install Strapi first.');
    console.log('Would you like to install Strapi now? (y/n)');

    return new Promise((resolve) => {
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y') {
          console.log('Installing Strapi...');
          console.log('This will create a new Strapi project in the strapi-backend directory.');

          // Create directory if it doesn't exist
          if (!fs.existsSync(strapiBackendPath)) {
            fs.mkdirSync(strapiBackendPath, { recursive: true });
          }

          // Install Strapi
          const strapiInstall = spawn('npx', ['create-strapi-app@latest', '.', '--quickstart'], {
            cwd: strapiBackendPath,
            stdio: 'inherit'
          });

          strapiInstall.on('close', (code) => {
            if (code === 0) {
              console.log('Strapi installed successfully!');
              resolve(true);
            } else {
              console.error(`Strapi installation failed with code ${code}`);
              resolve(false);
            }
          });
        } else {
          console.log('Please install Strapi manually and run this script again.');
          resolve(false);
        }
      });
    });
  }

  return true;
}

// Check .env file for Strapi configuration
async function checkEnvFile() {
  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    console.log('.env file not found. Creating a sample .env file...');

    const sampleEnv = `# Strapi Configuration
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here
`;

    fs.writeFileSync(envPath, sampleEnv);
    console.log('.env file created. Please update it with your Strapi API token.');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  if (!envContent.includes('STRAPI_API_TOKEN=')) {
    console.log('STRAPI_API_TOKEN not found in .env file. Please add it.');
    return false;
  }

  if (envContent.includes('STRAPI_API_TOKEN=your_strapi_api_token_here')) {
    console.log('Please update your STRAPI_API_TOKEN in the .env file with a valid token.');
    return false;
  }

  return true;
}

// Check mock data files
async function checkMockData() {
  const mockDir = path.join(__dirname, '../mock');

  if (!fs.existsSync(mockDir)) {
    console.log('Mock directory not found. Creating it...');
    fs.mkdirSync(mockDir, { recursive: true });
  }

  const blogPostsPath = path.join(mockDir, 'blog-posts.json');
  const assetsPath = path.join(mockDir, 'assets.json');
  const marketOverviewPath = path.join(mockDir, 'market-overview.json');

  let allFilesExist = true;

  if (!fs.existsSync(blogPostsPath)) {
    console.log('Blog posts mock file not found. Creating a sample file...');

    const sampleBlogPosts = [
      {
        title: "Bitcoin's Path to Mainstream Adoption",
        excerpt: "Exploring the journey of Bitcoin from a niche technology to a globally recognized asset class and the challenges it faces on the road to mainstream adoption.",
        author: "Alex Johnson",
        date: "2023-04-15",
        category: "Cryptocurrency"
      },
      {
        title: "Understanding Stock Market Volatility",
        excerpt: "A deep dive into the factors that contribute to stock market volatility and strategies for investors to navigate uncertain times.",
        author: "Sarah Williams",
        date: "2023-03-22",
        category: "Stocks"
      }
    ];

    fs.writeFileSync(blogPostsPath, JSON.stringify(sampleBlogPosts, null, 2));
    allFilesExist = false;
  }

  if (!fs.existsSync(assetsPath)) {
    console.log('Assets mock file not found. Creating a sample file...');

    const sampleAssets = [
      {
        name: "Bitcoin",
        symbol: "BTC",
        assetType: "crypto",
        description: "Bitcoin is a decentralized digital currency.",
        currentPrice: 50000,
        priceChange: 1500,
        priceChangePercent: 3.1,
        marketCap: 950000000000,
        volume24h: 30000000000,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        assetType: "crypto",
        description: "Ethereum is a decentralized computing platform.",
        currentPrice: 3000,
        priceChange: 100,
        priceChangePercent: 3.45,
        marketCap: 350000000000,
        volume24h: 15000000000,
        lastUpdated: new Date().toISOString()
      }
    ];

    fs.writeFileSync(assetsPath, JSON.stringify(sampleAssets, null, 2));
    allFilesExist = false;
  }

  if (!fs.existsSync(marketOverviewPath)) {
    console.log('Market overview mock file not found. Creating a sample file...');

    const sampleMarketOverview = {
      marketStatus: "open",
      lastUpdated: new Date().toISOString(),
      indices: [
        { name: "S&P 500", value: 4500.25, change: 15.75 },
        { name: "Nasdaq", value: 14200.50, change: 75.25 },
        { name: "Dow Jones", value: 35750.30, change: -50.20 }
      ],
      topMovers: [
        { symbol: "BTC", name: "Bitcoin", price: 50000, change: 1500, changePercent: 3.1 },
        { symbol: "ETH", name: "Ethereum", price: 3000, change: 100, changePercent: 3.45 }
      ],
      marketSummary: "Markets are generally positive today with technology and cryptocurrency sectors leading the gains."
    };

    fs.writeFileSync(marketOverviewPath, JSON.stringify(sampleMarketOverview, null, 2));
    allFilesExist = false;
  }

  if (!allFilesExist) {
    console.log('Mock data files have been created. You can customize them before running the migration.');
  } else {
    console.log('All mock data files exist.');
  }

  return true;
}

// Main function
async function main() {
  console.log('Starting Strapi migration diagnosis...');

  // Check if Strapi is installed
  const strapiInstalled = await checkStrapiInstallation();
  if (!strapiInstalled) {
    return;
  }

  // Check .env file
  const envConfigured = await checkEnvFile();
  if (!envConfigured) {
    console.log('Please update your .env file and run this script again.');
    return;
  }

  // Check mock data files
  await checkMockData();

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
        openStrapiAdmin();
        console.log('\nPlease create the following content types in Strapi:');
        console.log('1. Blog Post (API ID: blog-post)');
        console.log('   - Fields: title (Text), content (Rich Text), slug (Text), excerpt (Text), author (Text), category (Text), publishedAt (Date)');
        console.log('2. Asset (API ID: asset)');
        console.log('   - Fields: name (Text), symbol (Text), assetType (Text), description (Text), currentPrice (Number), priceChange (Number), priceChangePercent (Number), marketCap (Number), volume24h (Number), lastUpdated (Date)');
        console.log('3. Market Overview (API ID: market-overview)');
        console.log('   - Fields: marketStatus (Text), lastUpdated (Date), marketSummary (Text), indices (JSON), topMovers (JSON)');
        console.log('\nAfter creating the content types, run the migration script:');
        console.log('npm run strapi:migrate');
      } else {
        console.log('Please create the required content types manually and run the migration script again.');
      }
    });
  } else {
    console.log('All required content types exist. You can run the migration script:');
    console.log('npm run strapi:migrate');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
