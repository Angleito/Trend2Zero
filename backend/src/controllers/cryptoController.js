const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const cryptoService = require('../services/cryptoService');

exports.getCryptoList = catchAsync(async (req, res) => {
    const cryptos = await cryptoService.getCryptoList();
    res.status(200).json({
        status: 'success',
        data: cryptos
    });
});

exports.getCryptoPrice = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const price = await cryptoService.getCryptoPrice(symbol);
    res.status(200).json({
        status: 'success',
        data: price
    });
});

exports.getCryptoHistory = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    const { interval } = req.query;
    if (!interval) {
        throw new AppError('Interval parameter is required', 400);
    }
    const history = await cryptoService.getCryptoHistory(symbol, interval);
    res.status(200).json({
        status: 'success',
        data: history
    });
});

exports.getMarketCap = catchAsync(async (req, res) => {
    const marketCap = await cryptoService.getMarketCap();
    res.status(200).json({
        status: 'success',
        data: marketCap
    });
});

exports.getVolume = catchAsync(async (req, res) => {
    const volume = await cryptoService.getVolume();
    res.status(200).json({
        status: 'success',
        data: volume
    });
});

exports.getTrending = catchAsync(async (req, res) => {
    const trending = await cryptoService.getTrending();
    res.status(200).json({
        status: 'success',
        data: trending
    });
});

exports.addToPortfolio = catchAsync(async (req, res) => {
    const { symbol, amount, price } = req.body;
    const portfolio = await cryptoService.addToPortfolio(req.user.id, symbol, amount, price);
    res.status(201).json({
        status: 'success',
        data: portfolio
    });
});

exports.getPortfolio = catchAsync(async (req, res) => {
    const portfolio = await cryptoService.getPortfolio(req.user.id);
    res.status(200).json({
        status: 'success',
        data: portfolio
    });
});

exports.removeFromPortfolio = catchAsync(async (req, res) => {
    const { symbol } = req.params;
    await cryptoService.removeFromPortfolio(req.user.id, symbol);
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.recordTransaction = catchAsync(async (req, res) => {
    const { symbol, type, amount, price } = req.body;
    const transaction = await cryptoService.recordTransaction(
        req.user.id,
        symbol,
        type,
        amount,
        price
    );
    res.status(201).json({
        status: 'success',
        data: transaction
    });
});

exports.getTransactions = catchAsync(async (req, res) => {
    const transactions = await cryptoService.getTransactions(req.user.id);
    res.status(200).json({
        status: 'success',
        data: transactions
    });
});

exports.getPortfolioPerformance = catchAsync(async (req, res) => {
    const { timeframe } = req.query;
    const performance = await cryptoService.getPortfolioPerformance(req.user.id, timeframe);
    res.status(200).json({
        status: 'success',
        data: performance
    });
});

exports.getMarkets = catchAsync(async (req, res) => {
    const { limit = 100, sort = 'market_cap_desc', currency = 'usd' } = req.query;
    const markets = await cryptoService.getMarkets({ limit, sort, currency });
    res.json(markets);
});

exports.getCoinDetails = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new AppError.badRequest('Coin ID is required');
    }

    const coinDetails = await cryptoService.getCoinDetails(id);
    if (!coinDetails) {
        throw new AppError.notFound('Coin not found');
    }

    res.json(coinDetails);
});

exports.getSimplePrices = catchAsync(async (req, res) => {
    const { ids, currencies = ['usd'] } = req.query;
    if (!ids) {
        throw new AppError.badRequest('Coin IDs are required');
    }

    const coinIds = Array.isArray(ids) ? ids : ids.split(',');
    const currencyList = Array.isArray(currencies) ? currencies : currencies.split(',');
    
    const prices = await cryptoService.getSimplePrices(coinIds, currencyList);
    res.json(prices);
});