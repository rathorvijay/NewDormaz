import React, { useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Typography,
  Avatar,
} from '@mui/material';
import { ShoppingBag, ArrowForward, Visibility } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../../../redux/orderSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const statusColors = {
  'Order Placed': 'info',
  Packed: 'warning',
  Shipped: 'secondary',
  'Out for Delivery': 'primary',
  Delivered: 'success',
  Cancelled: 'error',
  'Return Requested': 'warning',
  'Return Approved': 'info',
  'Return Rejected': 'error',
  Refunded: 'success',
};

const paymentColor = (status) => {
  if (status === 'paid' || status === 'refunded') return 'success';
  if (status === 'refund_pending' || status === 'pending') return 'warning';
  return 'error';
};

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

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
          orders.map((order) => {
            const returnableItems = order.products?.filter((item) => item.returnPolicy?.isReturnable) || [];
            const isReturnOpen = order.orderStatus === 'Delivered' && order.returnRequest?.status === 'none' && order.returnEligibleUntil && new Date(order.returnEligibleUntil) > new Date();

            return (
              <Card key={order._id} sx={{ mb: 2, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.1)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Order ID</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>#{order._id.slice(-8).toUpperCase()}</Typography>
                    </Box>
                    <Chip label={order.orderStatus} color={statusColors[order.orderStatus] || 'default'} size="small" sx={{ fontWeight: 700 }} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Order Date</Typography>
                      <Typography variant="body2" fontWeight={600}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                    {order.products.map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f5f5', borderRadius: 2, p: 1, flexShrink: 0 }}>
                        <Avatar src={item.image} variant="rounded" sx={{ width: 48, height: 48 }}>📦</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">Qty: {item.quantity} • {item.size}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {returnableItems.length > 0 && (
                    <Alert severity={isReturnOpen ? 'info' : order.returnRequest?.status !== 'none' ? 'warning' : 'success'} sx={{ mb: 2 }}>
                      {order.returnRequest?.status !== 'none'
                        ? `Return status: ${order.returnRequest.status.replace('_', ' ')}`
                        : isReturnOpen
                          ? `Eligible for return until ${new Date(order.returnEligibleUntil).toLocaleDateString('en-IN')}`
                          : 'Return policy applied on selected items.'}
                    </Alert>
                  )}

                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                        <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(order.totalAmount)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Payment</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip label={order.paymentStatus} size="small" color={paymentColor(order.paymentStatus)} variant="outlined" />
                        </Box>
                      </Box>
                    </Box>
                    <Button variant="outlined" startIcon={<Visibility />} onClick={() => navigate(`/orders/${order._id}`)} size="small">
                      View Order
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Container>
    </Box>
  );
};

export default OrderHistory;
