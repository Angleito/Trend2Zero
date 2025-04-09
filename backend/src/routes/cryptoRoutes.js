const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');
const auth = require('../middleware/authMiddleware');

// Public routes
router.get('/list', cryptoController.getCryptoList);
router.get('/:symbol/price', cryptoController.getCryptoPrice);
router.get('/:symbol/history', cryptoController.getCryptoHistory);
router.get('/market-cap', cryptoController.getMarketCap);
router.get('/volume', cryptoController.getVolume);
router.get('/trending', cryptoController.getTrending);

// Protected routes
router.use(auth);
router.post('/portfolio', cryptoController.addToPortfolio);
router.get('/portfolio', cryptoController.getPortfolio);
router.delete('/portfolio/:symbol', cryptoController.removeFromPortfolio);
router.post('/transactions', cryptoController.recordTransaction);
router.get('/transactions', cryptoController.getTransactions);
router.get('/performance', cryptoController.getPortfolioPerformance);

module.exports = router;
