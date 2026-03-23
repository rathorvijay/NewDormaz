const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, updateProfile, toggleBlockUser, deleteUser,
  getCart, addToCart, updateCartItem, removeFromCart, clearCart
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Profile
router.put('/profile', protect, updateProfile);

// Cart
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.put('/cart/:itemId', protect, updateCartItem);
router.delete('/cart/:itemId', protect, removeFromCart);
router.delete('/cart', protect, clearCart);

// Admin routes
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id/block', protect, adminOnly, toggleBlockUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
