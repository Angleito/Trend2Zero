const express = require('express');
const router = express.Router();
const metalPriceService = require('../services/metalPriceService');
const catchAsync = require('../utils/catchAsync');

router.get('/current-prices', catchAsync(async (req, res) => {
  const metals = req.query.metals ? req.query.metals.split(',') : ['XAU', 'XAG', 'XPT'];
  const prices = await metalPriceService.getCurrentPrices(metals);
  
  res.status(200).json({
    status: 'success',
    data: prices,
    timestamp: new Date().toISOString()
  });
}));

router.get('/historical-price', catchAsync(async (req, res) => {
  const { metal, date } = req.query;
  
  if (!metal || !date) {
    return res.status(400).json({
      status: 'error',
      message: 'Metal and date are required parameters'
    });
  }

  const historicalPrice = await metalPriceService.getHistoricalPrices(metal, date);
  
  res.status(200).json({
    status: 'success',
    data: historicalPrice,
    timestamp: new Date().toISOString()
  });
}));

router.get('/convert', catchAsync(async (req, res) => {
  const { amount, fromMetal, toMetal } = req.query;
  
  if (!amount || !fromMetal || !toMetal) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount, fromMetal, and toMetal are required parameters'
    });
  }

  const convertedPrice = await metalPriceService.convertMetalPrice(
    parseFloat(amount), 
    fromMetal, 
    toMetal
  );
  
  res.status(200).json({
    status: 'success',
    data: convertedPrice,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;