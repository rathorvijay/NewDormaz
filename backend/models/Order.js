const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        image: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: String,
        returnPolicy: {
          isReturnable: { type: Boolean, default: false },
          returnWindowDays: { type: Number, default: 0 },
          policyNote: { type: String, default: '' },
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay',
    },
    paymentId: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'Order Placed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Return Requested',
        'Return Approved',
        'Return Rejected',
        'Refunded',
      ],
      default: 'Order Placed',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveredAt: Date,
    estimatedDelivery: Date,
    returnEligibleUntil: Date,
    returnRequest: {
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'refunded'],
        default: 'none',
      },
      reason: { type: String, default: '' },
      details: { type: String, default: '' },
      requestedAt: Date,
      approvedAt: Date,
      rejectedAt: Date,
      refundedAt: Date,
      adminNote: { type: String, default: '' },
      refundId: { type: String, default: '' },
      refundAmount: { type: Number, default: 0 },
      stockRestored: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
