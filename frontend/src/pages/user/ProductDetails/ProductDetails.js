import React, { useEffect, useState } from 'react';
import {
  Box, Container, Grid, Typography, Button, Chip, Divider, Rating,
  TextField, Avatar, Alert, Tabs, Tab, Card, CardContent, Select,
  MenuItem, FormControl, InputLabel, IconButton, Breadcrumbs, Link
} from '@mui/material';
import {
  ShoppingCart, WhatsApp, Star, Verified, LocalShipping,
  ArrowBack, Add, Remove
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../../../redux/productSlice';
import { addToCart } from '../../../redux/cartSlice';
import axiosInstance from '../../../api/axiosInstance';
import Loader from '../../../components/Loader';
import RatingStars from '../../../components/RatingStars';
import { formatPrice } from '../../../utils/formatPrice';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedProduct: product, loading } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProductById(id));
    loadReviews();
  }, [id, dispatch]);

  const loadReviews = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/${id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {}
  };

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price: product.price,
      finalPrice: product.finalPrice,
      size: product.size,
      quantity,
    }));
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewLoading(true);
    try {
      await axiosInstance.post('/reviews', { productId: id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
      dispatch(fetchProductById(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading || !product) return <Loader message="Loading product..." />;

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" underline="hover">Home</Link>
          <Link component={RouterLink} to="/products" underline="hover">Products</Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>{product.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Images */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Box sx={{
                borderRadius: 3, overflow: 'hidden', mb: 2, border: '2px solid #e0e0e0',
                height: 400, bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={product.images[selectedImage]?.url || 'https://via.placeholder.com/500'}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
                {product.images.map((img, i) => (
                  <Box
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    sx={{
                      width: 70, height: 70, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                      border: selectedImage === i ? '2px solid' : '2px solid transparent',
                      borderColor: selectedImage === i ? 'primary.main' : 'transparent',
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Details */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={product.category} color="primary" size="small" />
              <Chip label={product.size} variant="outlined" size="small" />
              {product.discount > 0 && <Chip label={`${product.discount}% OFF`} color="error" size="small" />}
              {product.isFeatured && <Chip label="⭐ Featured" color="secondary" size="small" />}
            </Box>

            <Typography variant="h4" fontWeight={800} gutterBottom>{product.name}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <RatingStars value={product.rating} numReviews={product.numReviews} />
            </Box>

            {/* Price */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h3" color="primary" fontWeight={800}>
                {formatPrice(product.finalPrice)}
              </Typography>
              {product.discount > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                    {formatPrice(product.price)}
                  </Typography>
                  <Typography color="error" fontWeight={600}>Save {formatPrice(product.price - product.finalPrice)}</Typography>
                </Box>
              )}
            </Box>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {product.features.map((f, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Verified fontSize="small" color="success" />
                    <Typography variant="body2">{f}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Stock */}
            {product.stock <= 5 && product.stock > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>Only {product.stock} left in stock!</Alert>
            )}
            {product.stock === 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>Out of Stock</Alert>
            )}

            {/* Quantity */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography fontWeight={600}>Quantity:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <IconButton size="small" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Remove /></IconButton>
                <Typography sx={{ px: 2, fontWeight: 600 }}>{quantity}</Typography>
                <IconButton size="small" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Add /></IconButton>
              </Box>
            </Box>

            {/* Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Button
                variant="outlined" size="large" startIcon={<ShoppingCart />}
                onClick={handleAddToCart} disabled={product.stock === 0}
                sx={{ flex: 1, minWidth: 160, py: 1.5 }}
              >
                Add to Cart
              </Button>
              <Button
                variant="contained" size="large"
                onClick={handleBuyNow} disabled={product.stock === 0}
                sx={{ flex: 1, minWidth: 160, py: 1.5 }}
              >
                Buy Now
              </Button>
            </Box>

            {/* Shipping info */}
            <Box sx={{ display: 'flex', gap: 3, p: 2, bgcolor: '#f0f4ff', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping color="primary" />
                <Typography variant="body2">Free delivery above ₹5000</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Verified color="success" />
                <Typography variant="body2">5 Year Warranty</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Tabs: Description & Reviews */}
        <Box sx={{ mt: 6 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab label="Description" />
            <Tab label={`Reviews (${product.numReviews || 0})`} />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 3 }}>
              <Typography variant="body1" sx={{ lineHeight: 2, whiteSpace: 'pre-line' }}>
                {product.description}
              </Typography>
              {product.tags && product.tags.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {product.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {/* Write Review */}
              {user && (
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Write a Review</Typography>
                    <form onSubmit={handleReviewSubmit}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography>Your Rating:</Typography>
                        <Rating
                          value={reviewForm.rating}
                          onChange={(e, val) => setReviewForm({ ...reviewForm, rating: val })}
                          size="large"
                        />
                      </Box>
                      <TextField
                        fullWidth multiline rows={3} label="Your Review"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        sx={{ mb: 2 }} required
                      />
                      <Button type="submit" variant="contained" disabled={reviewLoading}>
                        {reviewLoading ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No reviews yet. Be the first to review!</Typography>
              ) : (
                reviews.map((review) => (
                  <Card key={review._id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                          {review.userId?.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={600}>{review.userId?.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={review.rating} readOnly size="small" />
                            {review.isVerifiedPurchase && (
                              <Chip label="Verified Purchase" size="small" color="success" variant="outlined" sx={{ fontSize: '10px' }} />
                            )}
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString('en-IN')}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{review.comment}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ProductDetails;
