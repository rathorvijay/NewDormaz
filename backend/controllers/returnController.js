const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ReturnRequest = require('../models/Return');
const sendEmail = require('../utils/sendEmail');
const { RETURN_STATUSES, getReturnDeadline, buildReturnMeta } = require('../utils/returnUtils');

const sendReturnUpdateEmail = async ({ returnRequest, user, order }) => {
  try {
    const timelineHtml = (returnRequest.timeline || [])
      .map(
        (entry) => `
          <li style="margin-bottom:8px;">
            <strong>${entry.status}</strong> • ${new Date(entry.timestamp).toLocaleString('en-IN')}
            ${entry.note ? `<div style="color:#555;">${entry.note}</div>` : ''}
          </li>
        `
      )
      .join('');

    await sendEmail({
      to: user.email,
      subject: `Return Update: ${returnRequest.status} - Order #${order._id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#1a237e;color:#fff;padding:20px;border-radius:10px 10px 0 0;">
            <h2 style="margin:0;">Dormez Return Status Update</h2>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px;">
            <p>Hi ${user.name},</p>
            <p>Your return request for <strong>${returnRequest.productSnapshot.name}</strong> is now <strong>${returnRequest.status}</strong>.</p>
            <p><strong>Resolution:</strong> ${returnRequest.resolutionType}</p>
            <p><strong>Order:</strong> #${order._id}</p>
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0;">
              <h4 style="margin-top:0;">Timeline</h4>
              <ul style="padding-left:18px;margin-bottom:0;">${timelineHtml}</ul>
            </div>
            <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="background:#1a237e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;">Track Return</a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.log('Return email failed:', error.message);
  }
};

const createReturnRequest = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;
  const { orderItemId, reason, resolutionType, comments, refundMode, accountHolderName, bankName, accountNumber, ifscCode } = req.body;

  if (!orderItemId || !reason || !resolutionType) {
    res.status(400);
    throw new Error('Order item, reason and resolution type are required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to request return for this order');
  }

  const item = order.products.id(orderItemId);
  if (!item) {
    res.status(404);
    throw new Error('Order item not found');
  }

  const existingReturn = await ReturnRequest.findOne({ orderId: order._id, orderItemId });
  const returnMeta = buildReturnMeta({ order, item, existingReturn });
  if (!returnMeta.eligible) {
    res.status(400);
    throw new Error(returnMeta.message);
  }

  const proofImages = (req.files || []).map((file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
  if (['Damaged', 'Wrong item'].includes(reason) && proofImages.length === 0) {
    res.status(400);
    throw new Error('Image proof is required for damaged or wrong item returns');
  }

  const product = await Product.findById(item.productId).select('name');

  const totalReturnsByUser = await ReturnRequest.countDocuments({ userId: req.user._id });
  const sameProductReturnsByUser = await ReturnRequest.countDocuments({ userId: req.user._id, productId: item.productId });
  const highRisk = totalReturnsByUser >= 3 || sameProductReturnsByUser >= 2;
  const highRiskReason = highRisk
    ? sameProductReturnsByUser >= 2
      ? 'Frequent returns for the same product'
      : 'High return count for this user'
    : '';

  const refundDetails = {
    refundMode: refundMode || (order.paymentMethod === 'cod' ? 'bank_account' : 'original_source'),
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
  };

  if (resolutionType === 'refund' && order.paymentMethod === 'cod') {
    if (!refundDetails.accountHolderName || !refundDetails.bankName || !refundDetails.accountNumber || !refundDetails.ifscCode) {
      res.status(400);
      throw new Error('Bank account details are required for COD refunds');
    }
  }

  const returnRequest = await ReturnRequest.create({
    userId: req.user._id,
    orderId: order._id,
    orderItemId: item._id,
    productId: item.productId,
    productSnapshot: {
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
    },
    reason,
    resolutionType,
    comments,
    proofImages,
    status: 'Requested',
    eligibilitySnapshot: {
      deliveredAt: order.deliveredAt,
      returnDeadline: getReturnDeadline(order.deliveredAt, item.returnWindowDays),
      returnWindowDays: item.returnWindowDays || 7,
      orderStatusAtRequest: order.orderStatus,
      productReturnable: item.isReturnable !== false,
    },
    refundDetails,
    fraudSignals: {
      totalReturnsByUser,
      sameProductReturnsByUser,
      highRisk,
      reason: highRiskReason,
    },
    timeline: [
      {
        status: 'Requested',
        note: `Return created for ${reason}`,
        updatedBy: 'user',
        timestamp: new Date(),
      },
    ],
  });

  await sendReturnUpdateEmail({ returnRequest, user: req.user, order });

  res.status(201).json({
    success: true,
    message: 'Return request submitted successfully',
    returnRequest,
  });
});

const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ userId: req.user._id })
    .populate('orderId', 'orderStatus createdAt totalAmount')
    .sort({ createdAt: -1 });

  res.json({ success: true, returns });
});

const getAllReturns = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.status) query.status = req.query.status;
  if (req.query.resolutionType) query.resolutionType = req.query.resolutionType;
  if (req.query.risk === 'high') query['fraudSignals.highRisk'] = true;

  const total = await ReturnRequest.countDocuments(query);
  const returns = await ReturnRequest.find(query)
    .populate('userId', 'name email')
    .populate('orderId', 'paymentMethod paymentStatus totalAmount createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, returns, total, page, pages: Math.ceil(total / limit) });
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, note, scheduledFor, refundMode, accountHolderName, bankName, accountNumber, ifscCode } = req.body;
  const returnRequest = await ReturnRequest.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('orderId');

  if (!returnRequest) {
    res.status(404);
    throw new Error('Return request not found');
  }

  if (!RETURN_STATUSES.includes(status)) {
    res.status(400);
    throw new Error('Invalid return status');
  }

  returnRequest.status = status;
  if (scheduledFor) {
    returnRequest.pickupDetails = {
      ...(returnRequest.pickupDetails || {}),
      scheduledFor: new Date(scheduledFor),
      note: note || returnRequest.pickupDetails?.note,
    };
  }

  if (refundMode || accountHolderName || bankName || accountNumber || ifscCode) {
    returnRequest.refundDetails = {
      ...(returnRequest.refundDetails || {}),
      ...(refundMode ? { refundMode } : {}),
      ...(accountHolderName ? { accountHolderName } : {}),
      ...(bankName ? { bankName } : {}),
      ...(accountNumber ? { accountNumber } : {}),
      ...(ifscCode ? { ifscCode } : {}),
    };
  }

  if (status === 'Refund Initiated' && returnRequest.orderId.paymentMethod !== 'cod') {
    returnRequest.orderId.paymentStatus = 'refunded';
    await returnRequest.orderId.save();
  }

  returnRequest.timeline.push({
    status,
    note: note || '',
    updatedBy: 'admin',
    timestamp: new Date(),
  });

  await returnRequest.save();
  await sendReturnUpdateEmail({ returnRequest, user: returnRequest.userId, order: returnRequest.orderId });

  res.json({ success: true, returnRequest });
});

module.exports = {
  createReturnRequest,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
};
