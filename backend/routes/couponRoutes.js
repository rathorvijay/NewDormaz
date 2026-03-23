const express = require('express');
const router = express.Router();
const { createCoupon, getAllCoupons, applyCoupon, updateCoupon, deleteCoupon, toggleCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/apply', protect, applyCoupon);
router.get('/', protect, adminOnly, getAllCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.put('/:id/toggle', protect, adminOnly, toggleCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
