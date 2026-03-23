const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get sales analytics
// @route   GET /api/admin/analytics
// @access  Admin
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Total Revenue
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  // Today's Revenue
  const todayRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  // Weekly Revenue
  const weeklyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: weekAgo } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  // Monthly Revenue
  const monthlyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  // Yearly Revenue
  const yearlyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: yearStart } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
  ]);

  // Daily revenue chart (last 30 days)
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyChart = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: last30Days } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Monthly chart (last 12 months)
  const monthlyChart = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Revenue by category
  const categoryRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$products' },
    {
      $lookup: {
        from: 'products',
        localField: 'products.productId',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$productInfo.category',
        revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
        count: { $sum: '$products.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // Top selling products
  const topProducts = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.productId',
        name: { $first: '$products.name' },
        totalSold: { $sum: '$products.quantity' },
        revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  // Total counts
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const lowStockCount = await Product.countDocuments({ stock: { $lte: 5 } });

  res.json({
    success: true,
    summary: {
      totalRevenue: revenueAgg[0]?.total || 0,
      totalOrders: revenueAgg[0]?.count || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      todayOrders: todayRevenue[0]?.count || 0,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      weeklyOrders: weeklyRevenue[0]?.count || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      monthlyOrders: monthlyRevenue[0]?.count || 0,
      yearlyRevenue: yearlyRevenue[0]?.total || 0,
      yearlyOrders: yearlyRevenue[0]?.count || 0,
      totalUsers,
      totalProducts,
      allOrders: totalOrders,
      lowStockCount,
    },
    charts: { dailyChart, monthlyChart, categoryRevenue, topProducts, ordersByStatus },
  });
});

module.exports = { getSalesAnalytics };
