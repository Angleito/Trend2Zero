const express = require('express');
const cryptoController = require('../controllers/cryptoController');
const authController = require('../controllers/authController');

const router = express.Router();

// We'll implement the controller later, but define the routes now
// Public routes
router.get('/markets', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

router.get('/coins/:id', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

router.get('/simple/price', (req, res) => {
  res.status(501).json({
    status: 'error',
    message: 'This route is not yet implemented'
  });
});

module.exports = router;
