const Asset = require('../models/assetModel');
const HistoricalData = require('../models/historicalDataModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { fetchCryptoData, fetchStockData } = require('../services/marketDataService');

// Get all assets with filtering
exports.getAllAssets = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Asset.find(JSON.parse(queryStr));
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-popularity');
  }
  
  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query
  const assets = await query;
  
  // Send response
  res.status(200).json({
    status: 'success',
    results: assets.length,
    data: {
      assets
    }
  });
});

// Get asset by symbol
exports.getAsset = catchAsync(async (req, res, next) => {
  const asset = await Asset.findOne({ symbol: req.params.symbol.toUpperCase() });
  
  if (!asset) {
    return next(new AppError('No asset found with that symbol', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      asset
    }
  });
});

// Get asset price in BTC
exports.getAssetPriceInBTC = catchAsync(async (req, res, next) => {
  const { symbol } = req.params;
  
  // Find asset in database
  let asset = await Asset.findOne({ symbol: symbol.toUpperCase() });
  
  // If asset not found or data is stale (older than 1 hour), fetch fresh data
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  if (!asset || !asset.currentData.lastUpdated || asset.currentData.lastUpdated < oneHourAgo) {
    // Determine if it's a crypto or stock
    const isCrypto = /^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|DOT|AVAX|MATIC)$/i.test(symbol);
    
    try {
      let freshData;
      
      if (isCrypto) {
        freshData = await fetchCryptoData(symbol);
      } else {
        freshData = await fetchStockData(symbol);
      }
      
      // If asset exists, update it; otherwise create new one
      if (asset) {
        asset = await Asset.findOneAndUpdate(
          { symbol: symbol.toUpperCase() },
          {
            currentData: {
              priceInUSD: freshData.priceInUSD,
              priceInBTC: freshData.priceInBTC,
              change24h: freshData.change24h,
              lastUpdated: new Date()
            },
            returns: freshData.returns
          },
          { new: true }
        );
      } else {
        asset = await Asset.create({
          symbol: symbol.toUpperCase(),
          name: freshData.name || symbol,
          type: isCrypto ? 'Cryptocurrency' : 'Stocks',
          currentData: {
            priceInUSD: freshData.priceInUSD,
            priceInBTC: freshData.priceInBTC,
            change24h: freshData.change24h,
            lastUpdated: new Date()
          },
          returns: freshData.returns
        });
      }
    } catch (err) {
      // If fetching fails and we have no asset data, return error
      if (!asset) {
        return next(new AppError(`Failed to fetch data for ${symbol}`, 404));
      }
      // Otherwise continue with stale data
      console.error(`Error fetching fresh data for ${symbol}:`, err);
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      priceInBTC: asset.currentData.priceInBTC,
      priceInUSD: asset.currentData.priceInUSD,
      returns: asset.returns,
      lastUpdated: asset.currentData.lastUpdated
    }
  });
});

// Get historical data for an asset
exports.getHistoricalData = catchAsync(async (req, res, next) => {
  const { symbol } = req.params;
  const { timeframe = 'daily', currency = 'USD', days = 30 } = req.query;
  
  // Find historical data in database
  let historicalData = await HistoricalData.findOne({
    assetSymbol: symbol.toUpperCase(),
    timeframe,
    currency
  });
  
  // If no data found or data is stale (older than 1 day), fetch fresh data
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  if (!historicalData || historicalData.lastUpdated < oneDayAgo) {
    // Determine if it's a crypto or stock
    const isCrypto = /^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|DOT|AVAX|MATIC)$/i.test(symbol);
    
    try {
      let freshData;
      
      if (isCrypto) {
        freshData = await fetchCryptoHistoricalData(symbol, parseInt(days));
      } else {
        freshData = await fetchStockHistoricalData(symbol, parseInt(days));
      }
      
      // Create or update historical data
      if (!historicalData) {
        historicalData = await HistoricalData.create({
          assetSymbol: symbol.toUpperCase(),
          timeframe,
          currency,
          dataPoints: freshData,
          startDate: freshData[0]?.date || new Date(),
          endDate: freshData[freshData.length - 1]?.date || new Date(),
          lastUpdated: new Date()
        });
      } else {
        await historicalData.updateDataPoints(freshData);
      }
    } catch (err) {
      // If fetching fails and we have no data, return error
      if (!historicalData) {
        return next(new AppError(`Failed to fetch historical data for ${symbol}`, 404));
      }
      // Otherwise continue with stale data
      console.error(`Error fetching fresh historical data for ${symbol}:`, err);
    }
  }
  
  // Calculate date range based on requested days
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // Filter data points to requested range
  const filteredDataPoints = historicalData
    ? historicalData.getDataPointsInRange(startDate, endDate)
    : [];
  
  res.status(200).json({
    status: 'success',
    results: filteredDataPoints.length,
    data: {
      symbol: symbol.toUpperCase(),
      timeframe,
      currency,
      dataPoints: filteredDataPoints
    }
  });
});

// Search assets
exports.searchAssets = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  
  if (!query) {
    return next(new AppError('Please provide a search query', 400));
  }
  
  const assets = await Asset.search(query);
  
  res.status(200).json({
    status: 'success',
    results: assets.length,
    data: {
      assets
    }
  });
});

// Get popular assets
exports.getPopularAssets = catchAsync(async (req, res, next) => {
  const { limit = 10 } = req.query;
  
  const assets = await Asset.findPopular(parseInt(limit));
  
  res.status(200).json({
    status: 'success',
    results: assets.length,
    data: {
      assets
    }
  });
});

// Get assets by type
exports.getAssetsByType = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  const { limit = 20 } = req.query;
  
  if (!['Cryptocurrency', 'Stocks', 'Commodities', 'Indices'].includes(type)) {
    return next(new AppError('Invalid asset type', 400));
  }
  
  const assets = await Asset.findByType(type, parseInt(limit));
  
  res.status(200).json({
    status: 'success',
    results: assets.length,
    data: {
      assets
    }
  });
});
