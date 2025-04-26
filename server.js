const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const cors = require('cors')
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const fs = require('fs');
// Ensure logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');
const { SecureMarketDataService } = require('./lib/services/secureMarketDataService');

// --- DEBUG LOGGING START ---
console.log('DEBUG: NODE_ENV:', process.env.NODE_ENV);
console.log('DEBUG: PORT:', process.env.PORT);
console.log('DEBUG: MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
// --- DEBUG LOGGING END ---
const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Connect to MongoDB Atlas
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ MongoDB Atlas connected');

  // Initialize logger and service
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/backend.log' }),
      new winston.transports.File({ filename: 'logs/db.log', level: 'debug' })
    ]
  });
  // Enable Mongoose debug logging to Winston
  mongoose.set('debug', (collection, method, query, doc) => {
    logger.debug({ collection, method, query, doc }, 'Mongoose debug');
  });
  const marketService = new SecureMarketDataService({ logger });

  // Create Express server
  const server = express();
  server.use(cors());
  server.use(express.json());

  // API endpoints
  server.get('/api/assets', async (req, res) => {
    const assets = await marketService.listAvailableAssets({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      category: req.query.category,
      keywords: req.query.keywords
    });
    res.json(assets);
  });

  server.get('/api/overview', async (req, res) => {
    const overview = await marketService.getMarketOverview();
    res.json(overview);
  });

  // Next.js request handler
  server.all('*', (req, res) => handle(req, res, parse(req.url, true)));

  server.listen(port, hostname, err => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});