const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.use(authController.protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.patch('/updateMyPassword', authController.updatePassword);

module.exports = router;
