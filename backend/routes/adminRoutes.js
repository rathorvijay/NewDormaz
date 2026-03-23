const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/adminController');
const { getSalesAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/analytics', protect, adminOnly, getSalesAnalytics);

module.exports = router;
