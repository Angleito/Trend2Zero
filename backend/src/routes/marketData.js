const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    getMarketData,
    searchAssets,
    getPopularAssets,
    getAssetsByType,
    getAssetHistory,
    getAssetBySymbol
} = require('../controllers/marketDataController');

router.use(protect);

router.get('/:symbol', getMarketData);
router.get('/search', searchAssets);
router.get('/popular', getPopularAssets);
router.get('/assets/type/:type', getAssetsByType);
router.get('/history/:symbol', getAssetHistory);
router.get('/asset/:symbol', getAssetBySymbol);

module.exports = router;