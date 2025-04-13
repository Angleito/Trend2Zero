const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const marketDataService = require('../services/marketDataService');
const cache = require('../utils/cache');

const CACHE_TTL = 300; // 5 minutes

exports.getMarketData = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const cacheKey = `market-data-${symbol}`;
        
        let data = cache.get(cacheKey);
        if (!data) {
            data = await marketDataService.getMarketData(symbol);
            cache.set(cacheKey, data, CACHE_TTL);
        }
        
        res.status(200).json({ data });
    } catch (error) {
        next(new AppError('Error fetching market data', 500));
    }
};

exports.searchAssets = async (req, res, next) => {
    try {
        const { query, type = 'crypto', limit = 5 } = req.query;
        const cacheKey = `search-${query}-${type}-${limit}`;
        
        let results = cache.get(cacheKey);
        if (!results) {
            results = await marketDataService.searchAssets(query, type, limit);
            cache.set(cacheKey, results, CACHE_TTL);
        }
        
        res.status(200).json({ data: results });
    } catch (error) {
        next(new AppError('Error searching assets', 500));
    }
};

exports.getPopularAssets = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;
        const cacheKey = `popular-assets-${limit}`;
        
        let assets = cache.get(cacheKey);
        if (!assets) {
            assets = await marketDataService.getPopularAssets(limit);
            cache.set(cacheKey, assets, CACHE_TTL);
        }
        
        res.status(200).json({ data: assets });
    } catch (error) {
        next(new AppError('Error fetching popular assets', 500));
    }
};

exports.getAssetsByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { limit = 10 } = req.query;
        const cacheKey = `assets-type-${type}-${limit}`;
        
        let assets = cache.get(cacheKey);
        if (!assets) {
            assets = await marketDataService.getAssetsByType(type, limit);
            cache.set(cacheKey, assets, CACHE_TTL);
        }
        
        res.status(200).json({ data: assets });
    } catch (error) {
        next(new AppError('Error fetching assets by type', 500));
    }
};

exports.getAssetHistory = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const { days = 30, interval = '1d' } = req.query;
        const cacheKey = `asset-history-${symbol}-${days}-${interval}`;
        
        let history = cache.get(cacheKey);
        if (!history) {
            history = await marketDataService.getAssetHistory(symbol, { days, interval });
            cache.set(cacheKey, history, CACHE_TTL);
        }
        
        res.status(200).json({ data: history });
    } catch (error) {
        next(new AppError('Error fetching asset history', 500));
    }
};

exports.getAssetBySymbol = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const cacheKey = `asset-${symbol}`;
        
        let asset = cache.get(cacheKey);
        if (!asset) {
            asset = await marketDataService.getAssetBySymbol(symbol);
            cache.set(cacheKey, asset, CACHE_TTL);
        }
        
        res.status(200).json({ data: asset });
    } catch (error) {
        next(new AppError('Error fetching asset', 500));
    }
};

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
