/**
 * Migrate Mock Data to Strapi
 *
 * This script migrates mock data from the project to a Strapi backend.
 * It handles blog posts, assets, and market overview data.
 *
 * Usage:
 * node scripts/migrate-to-strapi.js
 *
 * Environment variables:
 * - STRAPI_API_URL: URL of the Strapi API (default: http://localhost:1337)
 * - STRAPI_API_TOKEN: API token for authentication
 *
 * Note: This script uses axios directly instead of the Strapi SDK
 * to avoid dependency issues.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock data paths
const BLOG_POSTS_PATH = path.join(__dirname, '../mock/blog-posts.json');
const ASSETS_MOCK_PATH = path.join(__dirname, '../mock/assets.json');
const MARKET_OVERVIEW_MOCK_PATH = path.join(__dirname, '../mock/market-overview.json');

// Strapi configuration
const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN is required. Please set it in your .env file.');
  process.exit(1);
}

// Strapi API client
const strapiClient = axios.create({
  baseURL: `${STRAPI_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${STRAPI_API_TOKEN}`
  }
});

/**
 * Extract blog posts from the JSON file
 */
async function extractBlogPosts() {
  try {
    if (fs.existsSync(BLOG_POSTS_PATH)) {
      const content = fs.readFileSync(BLOG_POSTS_PATH, 'utf8');
      return JSON.parse(content);
    } else {
      console.warn(`Blog posts mock file not found at ${BLOG_POSTS_PATH}`);
      return [];
    }
  } catch (error) {
    console.error('Error extracting blog posts:', error);
    return [];
  }
}

/**
 * Load mock assets data
 */
async function loadMockAssets() {
  try {
    if (fs.existsSync(ASSETS_MOCK_PATH)) {
      return JSON.parse(fs.readFileSync(ASSETS_MOCK_PATH, 'utf8'));
    } else {
      console.warn(`Assets mock file not found at ${ASSETS_MOCK_PATH}. Creating sample data instead.`);
      return [
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          assetType: 'crypto',
          description: 'Bitcoin is a decentralized digital currency.',
          currentPrice: 50000,
          priceChange: 1500,
          priceChangePercent: 3.1,
          marketCap: 950000000000,
          volume24h: 30000000000,
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          assetType: 'crypto',
          description: 'Ethereum is a decentralized computing platform.',
          currentPrice: 3000,
          priceChange: 100,
          priceChangePercent: 3.45,
          marketCap: 350000000000,
          volume24h: 15000000000,
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Apple Inc.',
          symbol: 'AAPL',
          assetType: 'stock',
          description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
          currentPrice: 175.25,
          priceChange: -2.30,
          priceChangePercent: -1.30,
          marketCap: 2800000000000,
          volume24h: 70000000,
          lastUpdated: new Date().toISOString()
        },
        {
          name: 'Gold',
          symbol: 'XAU',
          assetType: 'commodity',
          description: 'Gold is a precious metal used as a store of value and in jewelry.',
          currentPrice: 1950.50,
          priceChange: 15.75,
          priceChangePercent: 0.81,
          marketCap: null,
          volume24h: null,
          lastUpdated: new Date().toISOString()
        }
      ];
    }
  } catch (error) {
    console.error('Error loading mock assets:', error);
    return [];
  }
}

/**
 * Load mock market overview data
 */
async function loadMarketOverview() {
  try {
    if (fs.existsSync(MARKET_OVERVIEW_MOCK_PATH)) {
      return JSON.parse(fs.readFileSync(MARKET_OVERVIEW_MOCK_PATH, 'utf8'));
    } else {
      console.warn(`Market overview mock file not found at ${MARKET_OVERVIEW_MOCK_PATH}. Creating sample data instead.`);
      return {
        marketStatus: 'open',
        lastUpdated: new Date().toISOString(),
        indices: [
          { name: 'S&P 500', value: 4500.25, change: 15.75 },
          { name: 'Nasdaq', value: 14200.50, change: 75.25 },
          { name: 'Dow Jones', value: 35750.30, change: -50.20 }
        ],
        topMovers: [
          { symbol: 'BTC', name: 'Bitcoin', price: 50000, change: 1500, changePercent: 3.1 },
          { symbol: 'ETH', name: 'Ethereum', price: 3000, change: 100, changePercent: 3.45 },
          { symbol: 'AAPL', name: 'Apple Inc.', price: 175.25, change: -2.30, changePercent: -1.30 },
          { symbol: 'MSFT', name: 'Microsoft', price: 310.75, change: 5.25, changePercent: 1.72 },
          { symbol: 'TSLA', name: 'Tesla', price: 850.50, change: 25.75, changePercent: 3.12 }
        ],
        marketSummary: 'Markets are generally positive today with technology and cryptocurrency sectors leading the gains.'
      };
    }
  } catch (error) {
    console.error('Error loading market overview:', error);
    return null;
  }
}

/**
 * Migrate blog posts to Strapi
 */
async function migrateBlogPosts(posts) {
  console.log('Migrating blog posts...');

  for (const post of posts) {
    try {
      // Format the post for Strapi
      const strapiPost = {
        data: {
          title: post.title,
          content: post.excerpt, // Using excerpt as content since we don't have full content
          slug: post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-'),
          excerpt: post.excerpt,
          author: post.author,
          category: post.category,
          publishedAt: new Date(post.date).toISOString()
        }
      };

      // Check if post already exists
      const existingResponse = await strapiClient.get('/blog-posts', {
        params: {
          filters: {
            title: {
              $eq: post.title
            }
          }
        }
      });

      if (existingResponse.data.data && existingResponse.data.data.length > 0) {
        // Update existing post
        const existingId = existingResponse.data.data[0].id;
        await strapiClient.put(`/blog-posts/${existingId}`, strapiPost);
        console.log(`Updated blog post: ${post.title}`);
      } else {
        // Create new post
        await strapiClient.post('/blog-posts', strapiPost);
        console.log(`Created blog post: ${post.title}`);
      }
    } catch (error) {
      console.error(`Error migrating blog post "${post.title}":`, error.response?.data || error.message);
    }
  }

  console.log('Blog posts migration completed.');
}

/**
 * Migrate assets to Strapi
 */
async function migrateAssets(assets) {
  console.log('Migrating assets...');

  for (const asset of assets) {
    try {
      // Format the asset for Strapi
      const strapiAsset = {
        data: {
          name: asset.name,
          symbol: asset.symbol,
          assetType: asset.assetType,
          description: asset.description || '',
          currentPrice: asset.currentPrice,
          priceChange: asset.priceChange || 0,
          priceChangePercent: asset.priceChangePercent || 0,
          marketCap: asset.marketCap || 0,
          volume24h: asset.volume24h || 0,
          lastUpdated: asset.lastUpdated || new Date().toISOString()
        }
      };

      // Check if asset already exists
      const existingResponse = await strapiClient.get('/assets', {
        params: {
          filters: {
            symbol: {
              $eq: asset.symbol
            }
          }
        }
      });

      if (existingResponse.data.data && existingResponse.data.data.length > 0) {
        // Update existing asset
        const existingId = existingResponse.data.data[0].id;
        await strapiClient.put(`/assets/${existingId}`, strapiAsset);
        console.log(`Updated asset: ${asset.symbol}`);
      } else {
        // Create new asset
        await strapiClient.post('/assets', strapiAsset);
        console.log(`Created asset: ${asset.symbol}`);
      }
    } catch (error) {
      console.error(`Error migrating asset "${asset.symbol}":`, error.response?.data || error.message);
    }
  }

  console.log('Assets migration completed.');
}

/**
 * Migrate market overview to Strapi
 */
async function migrateMarketOverview(overview) {
  console.log('Migrating market overview...');

  if (!overview) {
    console.warn('No market overview data to migrate.');
    return;
  }

  try {
    // Format the market overview for Strapi
    const strapiOverview = {
      data: {
        marketStatus: overview.marketStatus,
        lastUpdated: overview.lastUpdated || new Date().toISOString(),
        marketSummary: overview.marketSummary || '',
        indices: overview.indices,
        topMovers: overview.topMovers
      }
    };

    // Check if market overview already exists
    const existingResponse = await strapiClient.get('/market-overview');

    if (existingResponse.data.data && existingResponse.data.data.length > 0) {
      // Update existing market overview
      const existingId = existingResponse.data.data[0].id;
      await strapiClient.put(`/market-overview/${existingId}`, strapiOverview);
      console.log('Updated market overview');
    } else {
      // Create new market overview
      await strapiClient.post('/market-overview', strapiOverview);
      console.log('Created market overview');
    }
  } catch (error) {
    console.error('Error migrating market overview:', error.response?.data || error.message);
  }

  console.log('Market overview migration completed.');
}

/**
 * Main migration function
 */
async function migrateData() {
  try {
    console.log('Starting data migration to Strapi...');

    // Extract and migrate blog posts
    const blogPosts = await extractBlogPosts();
    if (blogPosts.length > 0) {
      await migrateBlogPosts(blogPosts);
    } else {
      console.warn('No blog posts found to migrate.');
    }

    // Load and migrate assets
    const assets = await loadMockAssets();
    if (assets.length > 0) {
      await migrateAssets(assets);
    } else {
      console.warn('No assets found to migrate.');
    }

    // Load and migrate market overview
    const marketOverview = await loadMarketOverview();
    if (marketOverview) {
      await migrateMarketOverview(marketOverview);
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateData();
