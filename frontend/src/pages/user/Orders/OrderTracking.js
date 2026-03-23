import React, { useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Chip, Grid,
  Stepper, Step, StepLabel, Button, Divider, Avatar, Alert
} from '@mui/material';
import { ArrowBack, Cancel } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderById, cancelOrder } from '../../../redux/orderSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const trackingSteps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const OrderTracking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedOrder: order, loading } = useSelector((state) => state.orders);

  useEffect(() => { dispatch(fetchOrderById(id)); }, [id, dispatch]);

  if (loading || !order) return <Loader message="Loading order..." />;

  const currentStep = order.orderStatus === 'Cancelled' ? -1 : trackingSteps.indexOf(order.orderStatus);
  const isCancellable = ['Order Placed', 'Packed'].includes(order.orderStatus);

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')}>Back to Orders</Button>
          <Typography variant="h5" fontWeight={800}>
            Order #{order._id.slice(-8).toUpperCase()}
          </Typography>
          <Chip
            label={order.orderStatus}
            color={order.orderStatus === 'Delivered' ? 'success' : order.orderStatus === 'Cancelled' ? 'error' : 'primary'}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Tracking */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>📦 Order Tracking</Typography>
                {order.orderStatus === 'Cancelled' ? (
                  <Alert severity="error">This order has been cancelled.</Alert>
                ) : (
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {trackingSteps.map((step, index) => (
                      <Step key={step} completed={index <= currentStep}>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}
                {order.estimatedDelivery && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    Estimated Delivery: <strong>{new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Order Items */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Order Items</Typography>
                {order.products.map((item, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', gap: 2, py: 2, alignItems: 'center' }}>
                      <Avatar src={item.image} variant="rounded" sx={{ width: 64, height: 64 }}>📦</Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={700}>{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Size: {item.size} • Qty: {item.quantity}</Typography>
                        <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(item.price)}</Typography>
                      </Box>
                      <Typography fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                    </Box>
                    {i < order.products.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Details Sidebar */}
          <Grid item xs={12} md={5}>
            {/* Payment Details */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>💳 Payment Details</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Method</Typography>
                  <Typography fontWeight={600} sx={{ textTransform: 'uppercase' }}>{order.paymentMethod}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Status</Typography>
                  <Chip label={order.paymentStatus} size="small"
                    color={order.paymentStatus === 'paid' ? 'success' : 'warning'} />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>{formatPrice(order.subtotal)}</Typography>
                </Box>
                {order.couponDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Coupon ({order.couponCode})</Typography>
                    <Typography color="success.main">-{formatPrice(order.couponDiscount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Shipping</Typography>
                  <Typography>{order.shippingCharge === 0 ? 'FREE' : formatPrice(order.shippingCharge)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700} color="primary">{formatPrice(order.totalAmount)}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>📍 Delivery Address</Typography>
                <Typography fontWeight={600}>{order.shippingAddress.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress.street},<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                  {order.shippingAddress.country}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  📞 {order.shippingAddress.phone}
                </Typography>
              </CardContent>
            </Card>

            {isCancellable && (
              <Button
                variant="outlined" color="error" fullWidth startIcon={<Cancel />}
                onClick={() => dispatch(cancelOrder(order._id))}
              >
                Cancel Order
              </Button>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default OrderTracking;
