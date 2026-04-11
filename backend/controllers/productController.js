const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Review = require('../models/Review');

const normalizeArrayInput = (value, separator = ',') => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
};

const toBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return defaultValue;
};

const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, size, minPrice, maxPrice, sort, page, limit } = req.query;
  const query = {};

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } },
    ];
  }

  if (category) query.category = category;
  if (size) query.size = size;

  if (minPrice || maxPrice) {
    query.finalPrice = {};
    if (minPrice) query.finalPrice.$gte = Number(minPrice);
    if (maxPrice) query.finalPrice.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price-asc') sortOption = { finalPrice: 1 };
  else if (sort === 'price-desc') sortOption = { finalPrice: -1 };
  else if (sort === 'rating') sortOption = { rating: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNum);

  res.json({ success: true, products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true }).limit(8);
  res.json({ success: true, products });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    size,
    thickness,
    price,
    discount,
    stock,
    description,
    features,
    tags,
    isFeatured,
    isReturnable,
    returnWindowDays,
  } = req.body;

  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'dormez/products',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      });
      images.push({ public_id: result.public_id, url: result.secure_url });
    }
  }

  const product = await Product.create({
    name,
    category,
    size,
    thickness,
    price: Number(price),
    discount: Number(discount || 0),
    stock: Number(stock),
    description,
    features: normalizeArrayInput(features, '\n'),
    tags: normalizeArrayInput(tags, ','),
    isFeatured: toBoolean(isFeatured, false),
    isReturnable: toBoolean(isReturnable, true),
    returnWindowDays: Number(returnWindowDays || 7),
    images,
  });

  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updates = { ...req.body };
  if (updates.features !== undefined) updates.features = normalizeArrayInput(updates.features, '\n');
  if (updates.tags !== undefined) updates.tags = normalizeArrayInput(updates.tags, ',');
  if (updates.isFeatured !== undefined) updates.isFeatured = toBoolean(updates.isFeatured, product.isFeatured);
  if (updates.isReturnable !== undefined) updates.isReturnable = toBoolean(updates.isReturnable, product.isReturnable);
  if (updates.returnWindowDays !== undefined) updates.returnWindowDays = Number(updates.returnWindowDays || 7);
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.discount !== undefined) updates.discount = Number(updates.discount || 0);
  if (updates.stock !== undefined) updates.stock = Number(updates.stock);

  if (req.files && req.files.length > 0) {
    const newImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'dormez/products',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      });
      newImages.push({ public_id: result.public_id, url: result.secure_url });
    }
    updates.images = [...product.images, ...newImages];
  }

  product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (product) {
    product.finalPrice = product.discount > 0 ? Math.round(product.price - (product.price * product.discount) / 100) : product.price;
    await product.save();
  }

  res.json({ success: true, product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  for (const image of product.images) {
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  await Product.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ productId: req.params.id });

  res.json({ success: true, message: 'Product deleted successfully' });
});

const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 });
  res.json({ success: true, products });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  res.json({ success: true, categories });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories,
};
