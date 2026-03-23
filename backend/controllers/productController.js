const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const Review = require('../models/Review');

// @desc    Get all products with filters, search, pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, size, minPrice, maxPrice, sort, page, limit } = req.query;

  const query = {};

  // Search
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } },
    ];
  }

  // Filter by category
  if (category) query.category = category;

  // Filter by size
  if (size) query.size = size;

  // Filter by price range
  if (minPrice || maxPrice) {
    query.finalPrice = {};
    if (minPrice) query.finalPrice.$gte = Number(minPrice);
    if (maxPrice) query.finalPrice.$lte = Number(maxPrice);
  }

  // Sorting
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

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true }).limit(8);
  res.json({ success: true, products });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, category, size, thickness, price, discount, stock, description, features, tags, isFeatured } = req.body;

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
    name, category, size, thickness, price,
    discount: discount || 0, stock, description,
    features: features ? (Array.isArray(features) ? features : features.split(',')) : [],
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
    isFeatured: isFeatured || false,
    images,
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const updates = { ...req.body };

  // Handle new images
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

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  // Delete images from cloudinary
  for (const image of product.images) {
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  await Product.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ productId: req.params.id });

  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Admin
const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    { new: true }
  );
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, product });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Admin
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 });
  res.json({ success: true, products });
});

// @desc    Get product categories count
// @route   GET /api/products/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, categories });
});

module.exports = { getProducts, getFeaturedProducts, getProductById, createProduct, updateProduct, deleteProduct, updateStock, getLowStockProducts, getCategories };
