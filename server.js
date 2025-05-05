const express = require('express');
const next = require('next');
const cors = require('cors');
const mongoose = require('mongoose');
const winston = require('winston');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { parse } = require('url');
const { SecureMarketDataService } = require('./lib/services/secureMarketDataService');

// Load environment variables
dotenv.config();

// Determine the root directory
const ROOT_DIR = process.cwd();

// Create logs directory
const logsDir = path.resolve(ROOT_DIR, 'logs');
try {
  console.log('[DEBUG] Creating logs directory at:', logsDir);
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('[DEBUG] Logs directory created/verified successfully');
} catch (err) {
  console.error('[DEBUG] Error creating logs directory:', err);
  // Don't exit, just log the error
  console.error('[DEBUG] Will continue without log files');
}

// Initialize Winston logger with fallback to console if file logging fails
const loggerConfig = {
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
};

// Try to add file transports if directory exists
if (fs.existsSync(logsDir)) {
  loggerConfig.transports.push(
    new winston.transports.File({ 
      filename: path.resolve(logsDir, 'backend.log'),
      handleExceptions: true
    }),
    new winston.transports.File({ 
      filename: path.resolve(logsDir, 'db.log'),
      level: 'debug',
      handleExceptions: true
    })
  );
}

const logger = winston.createLogger(loggerConfig);

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Next.js server configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000', 10);

// Create Next.js app instance
const app = next({ 
  dev,
  dir: ROOT_DIR // Explicitly set the directory
});
const handle = app.getRequestHandler();

logger.debug('Initializing Next.js app...');

app.prepare().then(() => {
  logger.debug('Next.js app prepared successfully');
  logger.debug('Connecting to MongoDB...');
  
  // MongoDB connection options
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000, // 45 second timeout
  };

  mongoose.connect(process.env.MONGODB_URI, mongoOptions).then(() => {
    logger.debug('MongoDB Atlas connected');

    // Initialize service
    mongoose.set('debug', (collection, method, query, doc) => {
      logger.debug({ collection, method, query, doc }, 'Mongoose debug');
    });

    logger.debug('Initializing SecureMarketDataService...');
    const marketService = new SecureMarketDataService({ logger });
    logger.debug('SecureMarketDataService initialized.');

    // Create Express server
    logger.debug('Creating Express server...');
    const server = express();
    
    // Middleware
    server.use(cors());
    server.use(express.json());
    
    // Basic error handling middleware
    server.use((err, req, res, next) => {
      logger.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    logger.debug('Express server created. Registering API routes...');

    // API endpoints
    server.get('/api/assets', async (req, res) => {
      try {
        const assets = await marketService.listAvailableAssets({
          page: parseInt(req.query.page) || 1,
          pageSize: parseInt(req.query.pageSize) || 20,
          category: req.query.category,
          keywords: req.query.keywords
        });
        res.json(assets);
      } catch (err) {
        logger.error('Error fetching assets:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    server.get('/api/overview', async (req, res) => {
      try {
        const overview = await marketService.getMarketOverview();
        res.json(overview);
      } catch (err) {
        logger.error('Error fetching market overview:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Next.js request handler
    server.all('*', (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        return handle(req, res, parsedUrl);
      } catch (err) {
        logger.error('Error handling Next.js request:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start the server
    server.listen(port, hostname, err => {
      if (err) {
        logger.error('Error starting server:', err);
        throw err;
      }
      logger.info(`> Ready on http://${hostname}:${port}`);
    });
  }).catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });
}).catch(err => {
  logger.error('Next.js preparation error:', err);
  process.exit(1);
});