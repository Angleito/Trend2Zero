const express = require('express');
const stocksController = require('../controllers/stocksController');
const authController = require('../controllers/authController');

const router = express.Router();

// We'll implement the controller later, but define the routes now
// Public routes
router.get('/search', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

router.get('/quote/:symbol', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

router.get('/time-series/:symbol', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

router.get('/overview/:symbol', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

module.exports = router;
