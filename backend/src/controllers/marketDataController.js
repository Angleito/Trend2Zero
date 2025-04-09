const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const marketDataService = require('../services/marketDataService');

exports.searchAssets = catchAsync(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        throw new AppError('Query parameter is required', 400);
    }
    const results = await marketDataService.searchAssets(q);
    res.status(200).json({
        status: 'success',
        data: results
    });
});

exports.getPopularAssets = catchAsync(async (req, res) => {
    const assets = await marketDataService.getPopularAssets();
    res.status(200).json({
        status: 'success',
        data: assets
    });
});

exports.getAssetPrice = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const price = await marketDataService.getAssetPrice(symbol);
    res.status(200).json({
        status: 'success',
        data: price
    });
});

exports.getHistoricalPrices = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const { interval } = req.query;
    if (!interval) {
        throw new AppError('Interval parameter is required', 400);
    }
    const prices = await marketDataService.getHistoricalPrices(symbol, interval);
    res.status(200).json({
        status: 'success',
        data: prices
    });
});

exports.getAssetStats = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const stats = await marketDataService.getAssetStats(symbol);
    res.status(200).json({
        status: 'success',
        data: stats
    });
});

exports.getMarketOverview = catchAsync(async (req, res) => {
    const overview = await marketDataService.getMarketOverview();
    res.status(200).json({
        status: 'success',
        data: overview
    });
});

exports.getTrendingAssets = catchAsync(async (req, res) => {
    const trending = await marketDataService.getTrendingAssets();
    res.status(200).json({
        status: 'success',
        data: trending
    });
});

exports.addToWatchlist = catchAsync(async (req, res) => {
    const { symbol } = req.body;
    const watchlist = await marketDataService.addToWatchlist(req.user.id, symbol);
    res.status(200).json({
        status: 'success',
        data: watchlist
    });
});

exports.removeFromWatchlist = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const watchlist = await marketDataService.removeFromWatchlist(req.user.id, symbol);
    res.status(200).json({
        status: 'success',
        data: watchlist
    });
});

exports.getWatchlist = catchAsync(async (req, res) => {
    const watchlist = await marketDataService.getWatchlist(req.user.id);
    res.status(200).json({
        status: 'success',
        data: watchlist
    });
});

exports.createPriceAlert = catchAsync(async (req, res) => {
    const { symbol, price, condition } = req.body;
    const alert = await marketDataService.createPriceAlert(req.user.id, symbol, price, condition);
    res.status(201).json({
        status: 'success',
        data: alert
    });
});

exports.getPriceAlerts = catchAsync(async (req, res) => {
    const alerts = await marketDataService.getPriceAlerts(req.user.id);
    res.status(200).json({
        status: 'success',
        data: alerts
    });
});

exports.deletePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    await marketDataService.deletePriceAlert(req.user.id, id);
    res.status(204).json({
        status: 'success',
        data: null
    });
});
