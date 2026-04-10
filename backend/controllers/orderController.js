const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const sendEmail = require('../utils/sendEmail');
const razorpay = require('../config/razorpay');

const RETURNABLE_STATUSES = ['Return Requested', 'Return Approved', 'Return Rejected', 'Refunded'];

const hasReturnableItem = (order) => order.products.some((item) => item.returnPolicy?.isReturnable);
const getMaxReturnWindow = (order) =>
  Math.max(0, ...order.products.map((item) => Number(item.returnPolicy?.returnWindowDays) || 0));
const isReturnWindowOpen = (order) =>
  order.orderStatus === 'Delivered' &&
  hasReturnableItem(order) &&
  order.returnRequest?.status === 'none' &&
  order.returnEligibleUntil &&
  new Date(order.returnEligibleUntil).getTime() >= Date.now();

const restoreStockIfNeeded = async (order) => {
  if (order.returnRequest?.stockRestored) return;

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }

  order.returnRequest.stockRestored = true;
};

const sendReturnStatusEmail = async (order, subject, title, message) => {
  if (!order.userId?.email) return;

  try {
    await sendEmail({
      to: order.userId.email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a237e;">${title}</h2>
          <p>Dear ${order.userId.name || order.shippingAddress.fullName},</p>
          <p>${message}</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background:#1a237e;color:#fff;padding:10px 25px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:12px;">View Order</a>
        </div>
      `,
    });
  } catch (err) {
    console.log('Return status email failed:', err.message);
  }
};

const createOrder = asyncHandler(async (req, res) => {
  const { products, shippingAddress, paymentMethod, couponCode, couponDiscount, subtotal, shippingCharge, totalAmount } = req.body;

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error('No products in order');
  }

  const orderProducts = [];

  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    product.stock -= item.quantity;
    await product.save();

    orderProducts.push({
      productId: product._id,
      name: item.name || product.name,
      image: item.image || product.images?.[0]?.url || '',
      price: item.price || product.finalPrice || product.price,
      quantity: item.quantity,
      size: item.size || product.size,
      returnPolicy: {
        isReturnable: Boolean(product.returnPolicy?.isReturnable),
        returnWindowDays: Number(product.returnPolicy?.returnWindowDays) || 0,
        policyNote: product.returnPolicy?.policyNote || '',
      },
    });
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  const order = await Order.create({
    userId: req.user._id,
    products: orderProducts,
    shippingAddress,
    paymentMethod: paymentMethod || 'razorpay',
    paymentId: req.body.paymentId || '',
    paymentStatus: req.body.paymentStatus || 'pending',
    couponCode,
    couponDiscount: couponDiscount || 0,
    subtotal,
    shippingCharge: shippingCharge || 0,
    totalAmount,
    estimatedDelivery,
    statusHistory: [{ status: 'Order Placed', timestamp: new Date() }],
  });

  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

  try {
    const productRows = orderProducts.map((p) =>
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
              <tbody>${productRows}</tbody>
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
        </div>
      `,
    });
  } catch (err) {
    console.log('Order email failed:', err.message);
  }

  res.status(201).json({ success: true, order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, order });
});

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

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (RETURNABLE_STATUSES.includes(order.orderStatus) || order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded') {
    res.status(400);
    throw new Error('Use return actions for this order');
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'Delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';

    const maxReturnWindow = getMaxReturnWindow(order);
    if (maxReturnWindow > 0 && hasReturnableItem(order)) {
      const returnEligibleUntil = new Date(order.deliveredAt);
      returnEligibleUntil.setDate(returnEligibleUntil.getDate() + maxReturnWindow);
      order.returnEligibleUntil = returnEligibleUntil;
    }
  }

  await order.save();

  try {
    await sendEmail({
      to: order.userId.email,
      subject: `Order Update: ${orderStatus} - #${order._id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a237e;">🛏️ Dormez Mattress - Order Update</h2>
          <p>Dear ${order.userId.name},</p>
          <p>Your order <strong>#${order._id}</strong> status has been updated to:</p>
          <div style="background:#1a237e;color:white;padding:15px;text-align:center;border-radius:8px;font-size:18px;">${orderStatus}</div>
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

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (['Shipped', 'Out for Delivery', 'Delivered', 'Return Requested', 'Return Approved', 'Refunded'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Cannot cancel order at this stage');
  }

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }

  order.orderStatus = 'Cancelled';
  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', order });
});

const requestReturn = asyncHandler(async (req, res) => {
  const { reason, details } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to request return for this order');
  }

  if (!isReturnWindowOpen(order)) {
    res.status(400);
    throw new Error('This order is not eligible for return anymore');
  }

  order.orderStatus = 'Return Requested';
  order.returnRequest = {
    ...order.returnRequest,
    status: 'requested',
    reason: String(reason || '').trim(),
    details: String(details || '').trim(),
    requestedAt: new Date(),
    approvedAt: undefined,
    rejectedAt: undefined,
    refundedAt: undefined,
    adminNote: '',
    refundId: '',
    refundAmount: 0,
  };

  order.statusHistory.push({
    status: 'Return Requested',
    timestamp: new Date(),
    note: String(reason || 'Customer requested a return'),
  });

  await order.save();

  await sendReturnStatusEmail(
    order,
    `Return Request Received - #${order._id}`,
    'Return request submitted',
    'We received your return request and our team will review it shortly.'
  );

  res.json({ success: true, message: 'Return request submitted successfully', order });
});

const handleReturnRequest = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body;
  const order = await Order.findById(req.params.id).populate('userId', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!['requested', 'approved'].includes(order.returnRequest?.status)) {
    res.status(400);
    throw new Error('No active return request found for this order');
  }

  if (!['approve', 'reject', 'refund'].includes(action)) {
    res.status(400);
    throw new Error('Invalid return action');
  }

  const note = String(adminNote || '').trim();

  if (action === 'reject') {
    order.orderStatus = 'Return Rejected';
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectedAt = new Date();
    order.returnRequest.adminNote = note;
    await order.save();

    await sendReturnStatusEmail(
      order,
      `Return Request Update - #${order._id}`,
      'Return request rejected',
      note || 'Your return request was not approved.'
    );

    return res.json({ success: true, order, message: 'Return request rejected' });
  }

  if (action === 'approve') {
    order.returnRequest.status = 'approved';
    order.returnRequest.approvedAt = new Date();
    order.returnRequest.adminNote = note;
    order.orderStatus = 'Return Approved';

    if (order.paymentMethod === 'razorpay' && order.paymentId) {
      const refund = await razorpay.payments.refund(order.paymentId, {
        amount: Math.round(order.totalAmount * 100),
        speed: 'normal',
        notes: {
          orderId: String(order._id),
          reason: order.returnRequest.reason || 'return_request',
        },
      });

      order.paymentStatus = 'refunded';
      order.orderStatus = 'Refunded';
      order.returnRequest.status = 'refunded';
      order.returnRequest.refundedAt = new Date();
      order.returnRequest.refundId = refund.id;
      order.returnRequest.refundAmount = order.totalAmount;
      await restoreStockIfNeeded(order);
    } else {
      order.paymentStatus = 'refund_pending';
    }

    await order.save();

    await sendReturnStatusEmail(
      order,
      `Return Request Approved - #${order._id}`,
      order.returnRequest.status === 'refunded' ? 'Return approved and refund processed' : 'Return approved',
      order.returnRequest.status === 'refunded'
        ? 'Your return request was approved and the refund has been processed to your original payment method.'
        : 'Your return request was approved. The refund will be completed by our team shortly.'
    );

    return res.json({ success: true, order, message: order.returnRequest.status === 'refunded' ? 'Return approved and refund processed' : 'Return approved' });
  }

  order.paymentStatus = 'refunded';
  order.orderStatus = 'Refunded';
  order.returnRequest.status = 'refunded';
  order.returnRequest.refundedAt = new Date();
  order.returnRequest.adminNote = note;
  order.returnRequest.refundAmount = order.totalAmount;
  await restoreStockIfNeeded(order);
  await order.save();

  await sendReturnStatusEmail(
    order,
    `Refund Completed - #${order._id}`,
    'Refund completed',
    'Your refund has been completed successfully.'
  );

  res.json({ success: true, order, message: 'Refund marked as completed' });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  handleReturnRequest,
};
