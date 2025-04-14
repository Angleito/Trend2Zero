const express = require('express');
const router = express.Router();
const marketDataController = require('../controllers/marketDataController');
const { protect } = require('../controllers/authController');

router.get('/assets/search', marketDataController.searchAssets);
router.get('/assets/popular', marketDataController.getPopularAssets);
router.get('/assets/:symbol/price', marketDataController.getAssetPrice);
router.get('/assets/:symbol/history', marketDataController.getHistoricalPrices);
router.get('/assets/:symbol/stats', marketDataController.getAssetStats);
router.get('/markets/overview', marketDataController.getMarketOverview);
router.get('/markets/trending', marketDataController.getTrendingAssets);

// Protected routes
router.use(protect);
router.post('/watchlist', marketDataController.addToWatchlist);
router.delete('/watchlist/:symbol', marketDataController.removeFromWatchlist);
router.get('/watchlist', marketDataController.getWatchlist);
router.post('/alerts', marketDataController.createPriceAlert);
router.get('/alerts', marketDataController.getPriceAlerts);
router.delete('/alerts/:id', marketDataController.deletePriceAlert);

module.exports = router;
