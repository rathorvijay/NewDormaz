import React from 'react';
import {
  Card, CardMedia, CardContent, CardActions, Typography, Button,
  Box, Chip, Rating, IconButton, Tooltip
} from '@mui/material';
import { ShoppingCart, Visibility, FavoriteBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { formatPrice } from '../utils/formatPrice';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price: product.price,
      finalPrice: product.finalPrice,
      size: product.size,
      quantity: 1,
    }));
  };

  const categoryColors = {
    Luxury: '#7b1fa2', Ortho: '#1565c0', Premium: '#2e7d32',
    Memory: '#e65100', Spring: '#00695c',
  };

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s ease', cursor: 'pointer',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' },
      }}
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* Image */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="220"
          image={product.images[0]?.url || 'https://via.placeholder.com/400x220?text=Mattress'}
          alt={product.name}
          sx={{ objectFit: 'cover', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }}
        />
        {/* Badges */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Chip
            label={product.category}
            size="small"
            sx={{ bgcolor: categoryColors[product.category] || '#1a237e', color: 'white', fontWeight: 600, fontSize: '10px' }}
          />
          {product.discount > 0 && (
            <Chip label={`${product.discount}% OFF`} size="small" color="error" sx={{ fontWeight: 700, fontSize: '10px' }} />
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Chip label="Low Stock" size="small" color="warning" sx={{ fontSize: '10px' }} />
          )}
          {product.stock === 0 && (
            <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#616161', color: 'white', fontSize: '10px' }} />
          )}
        </Box>
        <IconButton
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'white', '&:hover': { bgcolor: '#fff0f0' } }}
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteBorder fontSize="small" color="error" />
        </IconButton>
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom noWrap>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
          Size: {product.size} • {product.thickness}
        </Typography>

        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Rating value={product.rating || 0} size="small" readOnly precision={0.5} />
          <Typography variant="caption" color="text.secondary">({product.numReviews || 0})</Typography>
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            {formatPrice(product.finalPrice)}
          </Typography>
          {product.discount > 0 && (
            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              {formatPrice(product.price)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <Tooltip title="View Details">
          <IconButton size="small" color="primary" sx={{ border: '1px solid', borderColor: 'primary.main' }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
