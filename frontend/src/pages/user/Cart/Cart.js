import React, { useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, IconButton,
  Button, Divider, Avatar, Chip, TextField, Alert
} from '@mui/material';
import { Add, Remove, Delete, ShoppingBag, ArrowForward } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../../redux/cartSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.cart);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const subtotal = items?.reduce((sum, item) => sum + (item.finalPrice || item.price) * item.quantity, 0) || 0;
  const shipping = subtotal >= 5000 ? 0 : 299;
  const total = subtotal + shipping;

  if (loading) return <Loader message="Loading cart..." />;

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={800} gutterBottom>🛒 Shopping Cart</Typography>

        {!items || items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'white', borderRadius: 3 }}>
            <Typography variant="h1" mb={2}>🛒</Typography>
            <Typography variant="h5" fontWeight={600} mb={1}>Your cart is empty</Typography>
            <Typography color="text.secondary" mb={3}>Looks like you haven't added any mattresses yet</Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/products')} endIcon={<ArrowForward />}>
              Start Shopping
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Cart Items */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  {items.map((item, index) => (
                    <Box key={item._id || index}>
                      <Box sx={{ display: 'flex', gap: 2, py: 2, alignItems: 'center' }}>
                        <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', flexShrink: 0, bgcolor: '#f5f5f5' }}>
                          <img
                            src={item.image || 'https://via.placeholder.com/80'}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} gutterBottom>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Size: {item.size}</Typography>
                          <Typography variant="h6" color="primary" fontWeight={700}>
                            {formatPrice(item.finalPrice || item.price)}
                          </Typography>
                        </Box>
                        {/* Quantity Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 2, px: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (item.quantity <= 1) dispatch(removeFromCart(item._id));
                              else dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }));
                            }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ px: 1.5, fontWeight: 600 }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                          {formatPrice((item.finalPrice || item.price) * item.quantity)}
                        </Typography>
                        <IconButton color="error" onClick={() => dispatch(removeFromCart(item._id))}>
                          <Delete />
                        </IconButton>
                      </Box>
                      {index < items.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box sx={{ pt: 2, textAlign: 'right' }}>
                    <Button color="error" startIcon={<Delete />} onClick={() => dispatch(clearCart())}>
                      Clear Cart
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 80 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Order Summary</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Subtotal ({items.length} items)</Typography>
                    <Typography fontWeight={600}>{formatPrice(subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Shipping</Typography>
                    <Typography fontWeight={600} color={shipping === 0 ? 'success.main' : 'inherit'}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </Typography>
                  </Box>
                  {shipping > 0 && (
                    <Alert severity="info" sx={{ mb: 2, py: 0.5, fontSize: 12 }}>
                      Add {formatPrice(5000 - subtotal)} more for free delivery!
                    </Alert>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Total</Typography>
                    <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(total)}</Typography>
                  </Box>
                  <Button
                    variant="contained" fullWidth size="large"
                    onClick={() => navigate('/checkout')}
                    endIcon={<ArrowForward />}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="text" fullWidth sx={{ mt: 1 }}
                    onClick={() => navigate('/products')}
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Cart;
