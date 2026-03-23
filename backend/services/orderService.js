const Order = require('../models/Order');
const Product = require('../models/Product');

const validateOrderStock = async (products) => {
  const errors = [];
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      errors.push(`Product ${item.productId} not found`);
      continue;
    }
    if (product.stock < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
    }
  }
  return errors;
};

const calculateOrderTotal = (products, shippingCharge, couponDiscount) => {
  const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingCharge || (subtotal >= 5000 ? 0 : 299);
  return subtotal + shipping - (couponDiscount || 0);
};

module.exports = { validateOrderStock, calculateOrderTotal };
