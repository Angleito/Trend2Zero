const express = require('express');
const router = express.Router();

const {
    signup,
    login,
    protect,
    forgotPassword,
    resetPassword,
    updatePassword,
    restrictTo
} = require('../controllers/authController');

const {
    getUser,
    updateUser,
    deleteUser,
    getAllUsers,
    updateMe,
    deleteMe,
    getMe
} = require('../controllers/userController');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/update-me', updateMe);
router.delete('/delete-me', deleteMe);
router.patch('/update-password', updatePassword);

// Admin only routes
router.use(restrictTo('admin'));

router.route('/')
    .get(getAllUsers);

router.route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

module.exports = router;