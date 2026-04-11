const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productSnapshot: {
      name: { type: String, required: true },
      image: { type: String, default: '' },
      price: { type: Number, default: 0 },
      quantity: { type: Number, default: 1 },
      size: { type: String, default: '' },
    },
    reason: {
      type: String,
      enum: ['Damaged', 'Wrong item', 'Not satisfied', 'Quality issue', 'Other'],
      required: true,
    },
    resolutionType: {
      type: String,
      enum: ['refund', 'replacement'],
      required: true,
    },
    comments: {
      type: String,
      default: '',
      maxlength: 500,
    },
    proofImages: [String],
    status: {
      type: String,
      enum: [
        'Requested',
        'Approved',
        'Rejected',
        'Pickup Scheduled',
        'Picked from customer',
        'Received at warehouse',
        'Quality Check Passed',
        'Quality Check Failed',
        'Refund Initiated',
        'Replacement Shipped',
        'Completed',
      ],
      default: 'Requested',
    },
    eligibilitySnapshot: {
      deliveredAt: Date,
      returnDeadline: Date,
      returnWindowDays: { type: Number, default: 7 },
      orderStatusAtRequest: String,
      productReturnable: Boolean,
    },
    refundDetails: {
      refundMode: {
        type: String,
        enum: ['original_source', 'bank_account'],
        default: 'original_source',
      },
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    pickupDetails: {
      scheduledFor: Date,
      note: String,
    },
    fraudSignals: {
      totalReturnsByUser: { type: Number, default: 0 },
      sameProductReturnsByUser: { type: Number, default: 0 },
      highRisk: { type: Boolean, default: false },
      reason: { type: String, default: '' },
    },
    timeline: [
      {
        status: String,
        note: String,
        updatedBy: {
          type: String,
          enum: ['system', 'user', 'admin'],
          default: 'system',
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

returnSchema.index({ orderId: 1, orderItemId: 1 }, { unique: true });
returnSchema.index({ userId: 1, createdAt: -1 });
returnSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Return', returnSchema);
