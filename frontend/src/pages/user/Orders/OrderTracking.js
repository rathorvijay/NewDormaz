import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Avatar,
} from '@mui/material';
import { ArrowBack, Cancel, Replay } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderById, cancelOrder, requestReturn } from '../../../redux/orderSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const trackingSteps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const paymentColor = (status) => {
  if (status === 'paid' || status === 'refunded') return 'success';
  if (status === 'pending' || status === 'refund_pending') return 'warning';
  return 'error';
};

const statusColor = (status) => {
  if (status === 'Delivered' || status === 'Refunded') return 'success';
  if (status === 'Cancelled' || status === 'Return Rejected') return 'error';
  if (status === 'Return Requested') return 'warning';
  return 'primary';
};

const OrderTracking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedOrder: order, loading } = useSelector((state) => state.orders);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  const isCancellable = useMemo(() => ['Order Placed', 'Packed'].includes(order?.orderStatus), [order]);
  const returnableItems = useMemo(() => order?.products?.filter((item) => item.returnPolicy?.isReturnable) || [], [order]);
  const isReturnOpen = useMemo(() => {
    if (!order) return false;
    return order.orderStatus === 'Delivered' && order.returnRequest?.status === 'none' && order.returnEligibleUntil && new Date(order.returnEligibleUntil) > new Date();
  }, [order]);

  if (loading || !order) return <Loader message="Loading order..." />;

  const currentStep = trackingSteps.indexOf(order.orderStatus);

  const handleReturnSubmit = async () => {
    const result = await dispatch(requestReturn({ id: order._id, reason: returnReason, details: returnDetails }));
    if (result.meta.requestStatus === 'fulfilled') {
      setReturnDialogOpen(false);
      setReturnReason('');
      setReturnDetails('');
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')}>Back to Orders</Button>
          <Typography variant="h5" fontWeight={800}>Order #{order._id.slice(-8).toUpperCase()}</Typography>
          <Chip label={order.orderStatus} color={statusColor(order.orderStatus)} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>📦 Order Tracking</Typography>
                {order.orderStatus === 'Cancelled' ? (
                  <Alert severity="error">This order has been cancelled.</Alert>
                ) : ['Return Requested', 'Return Approved', 'Return Rejected', 'Refunded'].includes(order.orderStatus) ? (
                  <Alert severity={order.orderStatus === 'Return Rejected' ? 'error' : order.orderStatus === 'Refunded' ? 'success' : 'warning'}>
                    {order.orderStatus === 'Return Requested' && 'Your return request is under review.'}
                    {order.orderStatus === 'Return Approved' && 'Your return request was approved and refund is being processed.'}
                    {order.orderStatus === 'Return Rejected' && (order.returnRequest?.adminNote || 'Your return request was rejected.')}
                    {order.orderStatus === 'Refunded' && 'Your return has been completed and refund has been issued.'}
                  </Alert>
                ) : (
                  <Stepper activeStep={currentStep} alternativeLabel>
                    {trackingSteps.map((step, index) => (
                      <Step key={step} completed={index <= currentStep}>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}

                {order.estimatedDelivery && order.orderStatus !== 'Delivered' && !['Cancelled', 'Refunded'].includes(order.orderStatus) && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                    Estimated Delivery: <strong>{new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

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
                        {item.returnPolicy?.isReturnable ? (
                          <Chip label={`Returnable within ${item.returnPolicy.returnWindowDays} days`} size="small" color="info" sx={{ mt: 1 }} />
                        ) : (
                          <Chip label="Not returnable" size="small" variant="outlined" sx={{ mt: 1 }} />
                        )}
                      </Box>
                      <Typography fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                    </Box>
                    {i < order.products.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>💳 Payment Details</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Method</Typography>
                  <Typography fontWeight={600} sx={{ textTransform: 'uppercase' }}>{order.paymentMethod}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Status</Typography>
                  <Chip label={order.paymentStatus} size="small" color={paymentColor(order.paymentStatus)} />
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

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>📍 Delivery Address</Typography>
                <Typography fontWeight={600}>{order.shippingAddress.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress.street},<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                  {order.shippingAddress.country}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>📞 {order.shippingAddress.phone}</Typography>
              </CardContent>
            </Card>

            {returnableItems.length > 0 && (
              <Alert severity={isReturnOpen ? 'info' : order.returnRequest?.status === 'requested' ? 'warning' : order.returnRequest?.status === 'refunded' ? 'success' : 'info'} sx={{ mb: 2 }}>
                {isReturnOpen && `Return available until ${new Date(order.returnEligibleUntil).toLocaleDateString('en-IN')}`}
                {!isReturnOpen && order.returnRequest?.status === 'requested' && 'Return request already submitted.'}
                {!isReturnOpen && order.returnRequest?.status === 'approved' && 'Return approved. Refund is in process.'}
                {!isReturnOpen && order.returnRequest?.status === 'rejected' && (order.returnRequest?.adminNote || 'Return request rejected.')}
                {!isReturnOpen && order.returnRequest?.status === 'refunded' && 'Refund completed successfully.'}
                {!isReturnOpen && order.returnRequest?.status === 'none' && order.orderStatus === 'Delivered' && order.returnEligibleUntil && new Date(order.returnEligibleUntil) <= new Date() && 'Return window has expired.'}
              </Alert>
            )}

            {isCancellable && (
              <Button variant="outlined" color="error" fullWidth startIcon={<Cancel />} onClick={() => dispatch(cancelOrder(order._id))} sx={{ mb: 2 }}>
                Cancel Order
              </Button>
            )}

            {isReturnOpen && (
              <Button variant="contained" fullWidth startIcon={<Replay />} onClick={() => setReturnDialogOpen(true)}>
                Request Return
              </Button>
            )}
          </Grid>
        </Grid>

        <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Request Return</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Reason for return"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              sx={{ mt: 1, mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Additional details"
              value={returnDetails}
              onChange={(e) => setReturnDetails(e.target.value)}
              multiline
              rows={4}
              placeholder="Describe the issue, damage, wrong product, etc."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleReturnSubmit} disabled={!returnReason.trim()}>
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OrderTracking;
