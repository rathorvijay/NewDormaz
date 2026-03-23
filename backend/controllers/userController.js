const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Cart = require('../models/Cart');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await User.countDocuments({ role: 'user' });
  const users = await User.find({ role: 'user' })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.address) {
    user.address = { ...user.address.toObject(), ...req.body.address };
  }
  if (req.body.password) {
    user.password = req.body.password;
  }

  const updated = await user.save();
  res.json({
    success: true,
    user: { _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, address: updated.address, role: updated.role },
  });
});

// @desc    Block/Unblock user
// @route   PUT /api/users/:id/block
// @access  Admin
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  await User.findByIdAndDelete(req.params.id);
  await Cart.findOneAndDelete({ userId: req.params.id });
  res.json({ success: true, message: 'User deleted successfully' });
});

// Cart operations
// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name images finalPrice stock');
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }
  res.json({ success: true, cart });
});

// @desc    Add to cart
// @route   POST /api/users/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, size, name, image, price, finalPrice } = req.body;
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });

  const existingItem = cart.items.find(item => item.productId.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity || 1;
  } else {
    cart.items.push({ productId, quantity: quantity || 1, size, name, image, price, finalPrice });
  }
  await cart.save();
  res.json({ success: true, cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/users/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  const item = cart.items.id(req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not found in cart'); }

  item.quantity = req.body.quantity;
  if (item.quantity <= 0) {
    cart.items.pull(req.params.itemId);
  }
  await cart.save();
  res.json({ success: true, cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }
  cart.items.pull(req.params.itemId);
  await cart.save();
  res.json({ success: true, cart });
});

// @desc    Clear cart
// @route   DELETE /api/users/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getAllUsers, getUserById, updateProfile, toggleBlockUser, deleteUser, getCart, addToCart, updateCartItem, removeFromCart, clearCart };
