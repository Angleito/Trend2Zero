const express = require('express');
const router = express.Router();

const marketDataRoutes = require('./marketData');
const userRoutes = require('./users');

router.use('/market-data', marketDataRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;