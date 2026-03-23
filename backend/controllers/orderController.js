const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const sendEmail = require('../utils/sendEmail');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { products, shippingAddress, paymentMethod, couponCode, couponDiscount, subtotal, shippingCharge, totalAmount } = req.body;

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error('No products in order');
  }

  // Validate stock and deduct
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) { res.status(404); throw new Error(`Product not found: ${item.productId}`); }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    product.stock -= item.quantity;
    await product.save();
  }

  // Estimate delivery date (5-7 days)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  const order = await Order.create({
    userId: req.user._id,
    products,
    shippingAddress,
    paymentMethod: paymentMethod || 'razorpay',
    couponCode,
    couponDiscount: couponDiscount || 0,
    subtotal,
    shippingCharge: shippingCharge || 0,
    totalAmount,
    estimatedDelivery,
    statusHistory: [{ status: 'Order Placed', timestamp: new Date() }],
  });

  // Clear cart after order
  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

  // Send order confirmation email
  try {
    const productRows = products.map(p =>
      `<tr><td>${p.name}</td><td>${p.size || '-'}</td><td>${p.quantity}</td><td>₹${p.price}</td></tr>`
    ).join('');

    await sendEmail({
      to: req.user.email,
      subject: `Order Confirmed! #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a237e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2>🛏️ Dormez Mattress</h2>
            <h3>Order Confirmed! ✅</h3>
          </div>
          <div style="background: #f5f5f5; padding: 20px;">
            <p>Dear ${shippingAddress.fullName},</p>
            <p>Your order has been confirmed! Here are the details:</p>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString('en-IN')}</p>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
              <thead>
                <tr style="background:#1a237e;color:white;">
                  <th style="padding:8px;text-align:left;">Product</th>
                  <th style="padding:8px;">Size</th>
                  <th style="padding:8px;">Qty</th>
                  <th style="padding:8px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
            
            <div style="text-align:right;margin-top:10px;">
              <p><strong>Subtotal:</strong> ₹${subtotal}</p>
              ${couponDiscount > 0 ? `<p style="color:green;"><strong>Coupon Discount:</strong> -₹${couponDiscount}</p>` : ''}
              <p><strong>Shipping:</strong> ₹${shippingCharge || 0}</p>
              <p style="font-size:18px;"><strong>Total: ₹${totalAmount}</strong></p>
            </div>
            
            <div style="margin-top:15px;background:white;padding:15px;border-radius:5px;">
              <h4>Delivery Address:</h4>
              <p>${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}</p>
            </div>
            
            <div style="margin-top:20px;text-align:center;">
              <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background:#1a237e;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px;">Track Order</a>
            </div>
          </div>
          <div style="background:#1a237e;color:white;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
            <p>Sweet Dreams with Dormez! 🌙</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.log('Order email failed:', err.message);
  }

  res.status(201).json({ success: true, order });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Check ownership or admin
  if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, paymentStatus } = req.query;

  const query = {};
  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name email');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.orderStatus = orderStatus;
  if (orderStatus === 'Delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  }

  await order.save();

  // Send status update email
  try {
    await sendEmail({
      to: order.userId.email,
      subject: `Order Update: ${orderStatus} - #${order._id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a237e;">🛏️ Dormez Mattress - Order Update</h2>
          <p>Dear ${order.userId.name},</p>
          <p>Your order <strong>#${order._id}</strong> status has been updated to:</p>
          <div style="background:#1a237e;color:white;padding:15px;text-align:center;border-radius:8px;font-size:18px;">
            ${orderStatus}
          </div>
          <br>
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background:#1a237e;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px;">View Order</a>
        </div>
      `,
    });
  } catch (err) {
    console.log('Status email failed:', err.message);
  }

  res.json({ success: true, order });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Cannot cancel order at this stage');
  }

  // Restore stock
  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }

  order.orderStatus = 'Cancelled';
  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder };
