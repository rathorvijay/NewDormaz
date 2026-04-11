const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ReturnRequest = require('../models/Return');

const getDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ orderStatus: 'Order Placed' });
  const lowStockProducts = await Product.countDocuments({ stock: { $lte: 5 } });
  const totalReturnRequests = await ReturnRequest.countDocuments();
  const pendingReturnRequests = await ReturnRequest.countDocuments({ status: { $in: ['Requested', 'Approved', 'Pickup Scheduled'] } });
  const highRiskReturns = await ReturnRequest.countDocuments({ 'fraudSignals.highRisk': true });

  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const recentOrders = await Order.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentUsers = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(5);

  const recentReturns = await ReturnRequest.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      totalRevenue: revenueAgg[0]?.total || 0,
      totalReturnRequests,
      pendingReturnRequests,
      highRiskReturns,
    },
    recentOrders,
    recentUsers,
    recentReturns,
  });
});

module.exports = { getDashboard };
