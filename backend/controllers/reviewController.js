const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Create / Update Review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  // Check if user has purchased this product
  const hasPurchased = await Order.findOne({
    userId: req.user._id,
    'products.productId': productId,
    orderStatus: 'Delivered',
  });

  // Check if already reviewed
  const existingReview = await Review.findOne({ userId: req.user._id, productId });

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.isVerifiedPurchase = !!hasPurchased;
    await existingReview.save();
  } else {
    await Review.create({
      userId: req.user._id,
      productId,
      rating,
      comment,
      isVerifiedPurchase: !!hasPurchased,
    });
  }

  // Recalculate product rating
  const reviews = await Review.find({ productId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  product.rating = Math.round(avgRating * 10) / 10;
  product.numReviews = reviews.length;
  await product.save();

  res.status(201).json({ success: true, message: 'Review submitted successfully' });
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const total = await Review.countDocuments({ productId: req.params.productId });
  const reviews = await Review.find({ productId: req.params.productId })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private / Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }

  // Allow owner or admin
  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  await Review.findByIdAndDelete(req.params.id);

  // Recalculate product rating
  const reviews = await Review.find({ productId: review.productId });
  const product = await Product.findById(review.productId);
  if (product) {
    product.rating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    product.numReviews = reviews.length;
    await product.save();
  }

  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { createReview, getProductReviews, deleteReview };
