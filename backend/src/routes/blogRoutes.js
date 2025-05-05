const express = require('express');
const blogController = require('../controllers/blogController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', blogController.getAllPosts);
router.get('/:slug', blogController.getPostBySlug);

// Protected routes (require authentication)
router.use(authController.protect);
router.use(authController.restrictTo('admin', 'editor'));

router.post('/', blogController.createPost);
router.patch('/:id', blogController.updatePost);
router.delete('/:id', blogController.deletePost);

module.exports = router; 