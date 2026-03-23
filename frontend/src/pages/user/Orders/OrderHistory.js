import React, { useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Chip, Grid,
  Button, Divider, Avatar
} from '@mui/material';
import { ShoppingBag, ArrowForward, Visibility } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../../../redux/orderSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const statusColors = {
  'Order Placed': 'info',
  'Packed': 'warning',
  'Shipped': 'secondary',
  'Out for Delivery': 'primary',
  'Delivered': 'success',
  'Cancelled': 'error',
};

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (loading) return <Loader message="Loading orders..." />;

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <ShoppingBag color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={800}>My Orders</Typography>
            <Typography color="text.secondary">{orders.length} total orders</Typography>
          </Box>
        </Box>

        {orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'white', borderRadius: 3 }}>
            <Typography variant="h1" mb={2}>📦</Typography>
            <Typography variant="h5" fontWeight={600} mb={1}>No orders yet</Typography>
            <Typography color="text.secondary" mb={3}>Start shopping to place your first order!</Typography>
            <Button variant="contained" onClick={() => navigate('/products')} endIcon={<ArrowForward />}>
              Shop Now
            </Button>
          </Box>
        ) : (
          orders.map((order) => (
            <Card key={order._id} sx={{ mb: 2, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.1)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Order ID</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>#{order._id.slice(-8).toUpperCase()}</Typography>
                  </Box>
                  <Chip
                    label={order.orderStatus}
                    color={statusColors[order.orderStatus] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Order Date</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </Typography>
                  </Box>
                </Box>

                {/* Products */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                  {order.products.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f5f5', borderRadius: 2, p: 1, flexShrink: 0 }}>
                      <Avatar src={item.image} variant="rounded" sx={{ width: 48, height: 48 }}>📦</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Qty: {item.quantity} • {item.size}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(order.totalAmount)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Payment</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                        <Chip
                          label={order.paymentStatus}
                          size="small"
                          color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined" startIcon={<Visibility />}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    size="small"
                  >
                    Track Order
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Container>
    </Box>
  );
};

export default OrderHistory;
