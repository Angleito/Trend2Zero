const express = require('express');
const router = express.Router();
const coinMarketCapService = require('../services/coinMarketCapService');
const catchAsync = require('../utils/catchAsync');

router.get('/cryptocurrency', catchAsync(async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({
      status: 'error',
      message: 'Cryptocurrency symbol is required'
    });
  }

  const cryptoData = await coinMarketCapService.getCryptoCurrencyData(symbol);

  res.status(200).json({
    status: 'success',
    data: cryptoData,
    timestamp: new Date().toISOString()
  });
}));

router.get('/top-cryptocurrencies', catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const topCryptos = await coinMarketCapService.getTopCryptocurrencies(limit);

  res.status(200).json({
    status: 'success',
    data: topCryptos,
    timestamp: new Date().toISOString()
  });
}));

router.get('/historical-prices', catchAsync(async (req, res) => {
  const { symbol, timeStart, timeEnd } = req.query;

  if (!symbol || !timeStart || !timeEnd) {
    return res.status(400).json({
      status: 'error',
      message: 'Symbol, timeStart, and timeEnd are required parameters'
    });
  }

  const historicalPrices = await coinMarketCapService.getHistoricalCryptoPrices(
    symbol,
    timeStart,
    timeEnd
  );

  res.status(200).json({
    status: 'success',
    data: historicalPrices,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
