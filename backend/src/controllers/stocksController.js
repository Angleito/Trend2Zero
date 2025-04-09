const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const stocksService = require('../services/stocksService');

exports.searchStocks = catchAsync(async (req, res) => {
    const { query } = req.query;
    if (!query) {
        throw new AppError('Query parameter is required', 400);
    }
    const stocks = await stocksService.searchStocks(query);
    res.status(200).json({
        status: 'success',
        data: stocks
    });
});

exports.getQuote = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const quote = await stocksService.getQuote(symbol);
    res.status(200).json({
        status: 'success',
        data: quote
    });
});

exports.getStockHistory = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const { interval } = req.query;
    if (!interval) {
        throw new AppError('Interval parameter is required', 400);
    }
    const history = await stocksService.getStockHistory(symbol, interval);
    res.status(200).json({
        status: 'success',
        data: history
    });
});

exports.getMarketIndices = catchAsync(async (req, res) => {
    const indices = await stocksService.getMarketIndices();
    res.status(200).json({
        status: 'success',
        data: indices
    });
});

exports.getSectorPerformance = catchAsync(async (req, res) => {
    const performance = await stocksService.getSectorPerformance();
    res.status(200).json({
        status: 'success',
        data: performance
    });
});

exports.getTopGainers = catchAsync(async (req, res) => {
    const gainers = await stocksService.getTopGainers();
    res.status(200).json({
        status: 'success',
        data: gainers
    });
});

exports.getTopLosers = catchAsync(async (req, res) => {
    const losers = await stocksService.getTopLosers();
    res.status(200).json({
        status: 'success',
        data: losers
    });
});

exports.addToPortfolio = catchAsync(async (req, res) => {
    const { symbol, shares, price } = req.body;
    const portfolio = await stocksService.addToPortfolio(req.user.id, symbol, shares, price);
    res.status(201).json({
        status: 'success',
        data: portfolio
    });
});

exports.getPortfolio = catchAsync(async (req, res) => {
    const portfolio = await stocksService.getPortfolio(req.user.id);
    res.status(200).json({
        status: 'success',
        data: portfolio
    });
});

exports.removeFromPortfolio = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    await stocksService.removeFromPortfolio(req.user.id, symbol);
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.placeOrder = catchAsync(async (req, res) => {
    const { symbol, type, shares, price } = req.body;
    const order = await stocksService.placeOrder(req.user.id, symbol, type, shares, price);
    res.status(201).json({
        status: 'success',
        data: order
    });
});

exports.getOrders = catchAsync(async (req, res) => {
    const orders = await stocksService.getOrders(req.user.id);
    res.status(200).json({
        status: 'success',
        data: orders
    });
});

exports.getPositions = catchAsync(async (req, res) => {
    const positions = await stocksService.getPositions(req.user.id);
    res.status(200).json({
        status: 'success',
        data: positions
    });
});