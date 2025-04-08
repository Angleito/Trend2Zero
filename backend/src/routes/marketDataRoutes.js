const express = require('express');
const marketDataController = require('../controllers/marketDataController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/assets', marketDataController.getAllAssets);
router.get('/assets/popular', marketDataController.getPopularAssets);
router.get('/assets/search', marketDataController.searchAssets);
router.get('/assets/type/:type', marketDataController.getAssetsByType);
router.get('/assets/:symbol', marketDataController.getAsset);
router.get('/price/:symbol', marketDataController.getAssetPriceInBTC);
router.get('/historical/:symbol', marketDataController.getHistoricalData);

// Protected routes
router.use(authController.protect);

// No protected routes yet, but can be added here

module.exports = router;
