const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';

async function readMockData(filename) {
  const filePath = path.join(__dirname, '..', 'mock', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function createBlogPosts() {
  const blogPosts = await readMockData('blog-posts.json');
  
  for (const post of blogPosts) {
    try {
      await axios.post(`${STRAPI_URL}/blog-posts`, {
        data: {
          title: post.title,
          content: post.content,
          slug: post.slug,
          excerpt: post.excerpt,
          author: post.author,
          category: post.category,
          publishedAt: post.publishedAt || new Date().toISOString()
        }
      });
      console.log(`Created blog post: ${post.title}`);
    } catch (error) {
      console.error(`Error creating blog post ${post.title}:`, error.response ? error.response.data : error.message);
    }
  }
}

async function createAssets() {
  const assets = await readMockData('assets.json');
  
  for (const asset of assets) {
    try {
      await axios.post(`${STRAPI_URL}/assets`, {
        data: {
          name: asset.name,
          symbol: asset.symbol,
          assetType: asset.assetType,
          description: asset.description,
          currentPrice: asset.currentPrice,
          priceChange: asset.priceChange,
          priceChangePercent: asset.priceChangePercent,
          marketCap: asset.marketCap,
          volume24h: asset.volume24h,
          lastUpdated: asset.lastUpdated || new Date().toISOString()
        }
      });
      console.log(`Created asset: ${asset.name}`);
    } catch (error) {
      console.error(`Error creating asset ${asset.name}:`, error.response ? error.response.data : error.message);
    }
  }
}

async function createMarketOverview() {
  const marketOverview = await readMockData('market-overview.json');
  
  try {
    await axios.post(`${STRAPI_URL}/market-overview`, {
      data: {
        marketStatus: marketOverview.marketStatus,
        lastUpdated: marketOverview.lastUpdated || new Date().toISOString(),
        marketSummary: marketOverview.marketSummary,
        indices: marketOverview.indices.map(index => ({
          Name: index.name,
          Value: index.value,
          Change: index.change
        })),
        topMovers: marketOverview.topMovers.map(mover => ({
          Symbol: mover.symbol,
          Name: mover.name,
          Price: mover.price,
          Change: mover.change,
          ChangePercent: mover.changePercent
        }))
      }
    });
    console.log('Created market overview');
  } catch (error) {
    console.error('Error creating market overview:', error.response ? error.response.data : error.message);
  }
}

async function migrateMockData() {
  try {
    await createBlogPosts();
    await createAssets();
    await createMarketOverview();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateMockData();
