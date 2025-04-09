const express = require('express');
const router = express.Router();
const stocksController = require('../controllers/stocksController');
const auth = require('../middleware/authMiddleware');

// Public routes
router.get('/search', stocksController.searchStocks);
router.get('/:symbol/quote', stocksController.getQuote);
router.get('/:symbol/history', stocksController.getStockHistory);
router.get('/market/indices', stocksController.getMarketIndices);
router.get('/market/sectors', stocksController.getSectorPerformance);
router.get('/gainers', stocksController.getTopGainers);
router.get('/losers', stocksController.getTopLosers);

// Protected routes
router.use(auth);
router.post('/portfolio', stocksController.addToPortfolio);
router.get('/portfolio', stocksController.getPortfolio);
router.delete('/portfolio/:symbol', stocksController.removeFromPortfolio);
router.post('/orders', stocksController.placeOrder);
router.get('/orders', stocksController.getOrders);
router.get('/positions', stocksController.getPositions);

module.exports = router;
