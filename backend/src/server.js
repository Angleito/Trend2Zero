const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const historicalDataJob = require('./jobs/historicalDataJob');
const historicalDataRoutes = require('./routes/historicalDataRoutes');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/historical-data', historicalDataRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Connected to MongoDB successfully');
  
  // Start historical data collection job
  historicalDataJob();
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
  process.exit(1);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong',
    message: err.message
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
