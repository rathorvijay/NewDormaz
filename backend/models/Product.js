const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: ['Luxury', 'Ortho', 'Premium', 'Memory', 'Spring'],
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      enum: ['Single', 'Double', 'Queen', 'King', 'Custom'],
    },
    thickness: {
      type: String,
      required: [true, 'Thickness is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [
      {
        public_id: String,
        url: { type: String, required: true },
      },
    ],
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    features: [String],
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Auto-calculate finalPrice before save
productSchema.pre('save', function (next) {
  if (this.discount > 0) {
    this.finalPrice = Math.round(this.price - (this.price * this.discount) / 100);
  } else {
    this.finalPrice = this.price;
  }
  next();
});

// Virtual for low stock alert
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= 5;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
