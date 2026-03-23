const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        image: String,
        price: Number,
        finalPrice: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        size: String,
      },
    ],
  },
  { timestamps: true }
);

// Virtual for total
cartSchema.virtual('total').get(function () {
  return this.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
