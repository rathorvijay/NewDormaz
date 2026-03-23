const express = require('express');
const router = express.Router();
const {
  getProducts, getFeaturedProducts, getProductById, createProduct,
  updateProduct, deleteProduct, updateStock, getLowStockProducts, getCategories
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/low-stock', protect, adminOnly, getLowStockProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

router.post('/', protect, adminOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.put('/:id/stock', protect, adminOnly, updateStock);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
