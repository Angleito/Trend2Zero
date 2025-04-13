const express = require('express');
const router = express.Router();
const HistoricalDataService = require('../services/historicalDataService');
const logger = require('../utils/logger');

// Get historical data for a specific symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;

    // Validate input
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const historicalData = await HistoricalDataService.getHistoricalData(symbol, parseInt(days));
    
    res.json(historicalData);
  } catch (error) {
    logger.error(`Error fetching historical data for ${symbol}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch historical data', 
      details: error.message 
    });
  }
});

// Get historical data for multiple symbols
router.get('/', async (req, res) => {
  try {
    const { symbols, category, days = 30 } = req.query;

    // Validate input
    if (!symbols && !category) {
      return res.status(400).json({ error: 'Symbols or category is required' });
    }

    let historicalData;
    if (symbols) {
      const symbolList = Array.isArray(symbols) ? symbols : symbols.split(',');
      historicalData = await Promise.all(
        symbolList.map(symbol => 
          HistoricalDataService.getHistoricalData(symbol, parseInt(days))
        )
      );
    } else if (category) {
      historicalData = await HistoricalDataService.getHistoricalDataByCategory(
        category, 
        parseInt(days)
      );
    }
    
    res.json(historicalData);
  } catch (error) {
    logger.error('Error fetching historical data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch historical data', 
      details: error.message 
    });
  }
});

module.exports = router;