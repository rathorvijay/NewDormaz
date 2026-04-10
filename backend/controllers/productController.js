const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Review = require('../models/Review');

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeReturnPolicy = (body = {}) => {
  const isReturnable = body.returnPolicy?.isReturnable ?? body.returnable ?? body.isReturnable ?? 'false';
  const returnWindowDays = body.returnPolicy?.returnWindowDays ?? body.returnWindowDays ?? 0;
  const policyNote = body.returnPolicy?.policyNote ?? body.policyNote ?? '';

  const normalizedIsReturnable = isReturnable === true || isReturnable === 'true' || isReturnable === 'on' || isReturnable === 1 || isReturnable === '1';
  const normalizedWindow = normalizedIsReturnable ? Math.max(0, Number(returnWindowDays) || 0) : 0;

  return {
    isReturnable: normalizedIsReturnable,
    returnWindowDays: normalizedWindow,
    policyNote: String(policyNote || '').trim(),
  };
};

// @desc    Get all products with filters, search, pagination
// @route   GET /api/products
// @access  Public
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

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
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
  const { name, category, size, thickness, price, discount, stock, description, isFeatured } = req.body;

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
    price,
    discount: discount || 0,
    stock,
    description,
    features: parseList(req.body.features),
    tags: parseList(req.body.tags),
    isFeatured: isFeatured === true || isFeatured === 'true',
    returnPolicy: normalizeReturnPolicy(req.body),
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

  const updates = {
    ...req.body,
    features: req.body.features !== undefined ? parseList(req.body.features) : product.features,
    tags: req.body.tags !== undefined ? parseList(req.body.tags) : product.tags,
    returnPolicy: normalizeReturnPolicy({
      ...product.toObject(),
      ...product.returnPolicy?.toObject?.(),
      ...req.body,
      returnPolicy: {
        ...(product.returnPolicy?.toObject?.() || product.returnPolicy || {}),
        ...(req.body.returnPolicy || {}),
      },
    }),
  };

  if (updates.isFeatured !== undefined) {
    updates.isFeatured = updates.isFeatured === true || updates.isFeatured === 'true';
  }

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
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    { new: true }
  );
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
  const categories = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
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
