const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discount, discountType, minOrderAmount, maxDiscount, expiryDate, usageLimit } = req.body;

  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) { res.status(400); throw new Error('Coupon code already exists'); }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discount,
    discountType: discountType || 'percentage',
    minOrderAmount: minOrderAmount || 0,
    maxDiscount: maxDiscount || null,
    expiryDate,
    usageLimit: usageLimit || null,
  });

  res.status(201).json({ success: true, coupon });
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc    Validate & apply coupon
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) { res.status(404); throw new Error('Invalid coupon code'); }
  if (!coupon.active) { res.status(400); throw new Error('This coupon is no longer active'); }
  if (new Date(coupon.expiryDate) < new Date()) { res.status(400); throw new Error('Coupon has expired'); }
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Coupon usage limit reached');
  }
  if (coupon.usedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((orderAmount * coupon.discount) / 100);
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else {
    discountAmount = coupon.discount;
  }

  res.json({
    success: true,
    coupon: { code: coupon.code, discount: coupon.discount, discountType: coupon.discountType },
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  });
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  res.json({ success: true, coupon });
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  res.json({ success: true, message: 'Coupon deleted' });
});

// @desc    Toggle coupon active status
// @route   PUT /api/coupons/:id/toggle
// @access  Admin
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  coupon.active = !coupon.active;
  await coupon.save();
  res.json({ success: true, coupon });
});

module.exports = { createCoupon, getAllCoupons, applyCoupon, updateCoupon, deleteCoupon, toggleCoupon };
