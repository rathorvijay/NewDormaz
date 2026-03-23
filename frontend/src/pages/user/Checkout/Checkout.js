import React, { useState } from 'react';
import {
  Box, Container, Grid, Typography, TextField, Button, Card, CardContent,
  Divider, Stepper, Step, StepLabel, Radio, RadioGroup, FormControlLabel,
  FormControl, Alert, CircularProgress, Chip
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../../redux/orderSlice';
import { clearCart } from '../../../redux/cartSlice';
import axiosInstance from '../../../api/axiosInstance';
import { initRazorpayPayment } from '../../../utils/razorpay';
import { formatPrice } from '../../../utils/formatPrice';
import toast from 'react-hot-toast';

const steps = ['Shipping Address', 'Payment', 'Order Placed'];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const { loading } = useSelector((state) => state.orders);

  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
    country: 'India',
  });

  const subtotal = items?.reduce((sum, item) => sum + (item.finalPrice || item.price) * item.quantity, 0) || 0;
  const shipping = subtotal >= 5000 ? 0 : 299;
  const totalBeforeCoupon = subtotal + shipping;
  const finalTotal = Math.max(0, totalBeforeCoupon - couponDiscount);

  const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const validateAddress = () => {
    return address.fullName && address.phone && address.street && address.city && address.state && address.pincode;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await axiosInstance.post('/coupons/apply', { code: couponCode, orderAmount: totalBeforeCoupon });
      setCouponDiscount(res.data.discountAmount);
      setCouponApplied(true);
      toast.success(`Coupon applied! Saved ${formatPrice(res.data.discountAmount)} 🎉`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const placeOrder = async (paymentId = '') => {
    const orderData = {
      products: items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.finalPrice || item.price,
        quantity: item.quantity,
        size: item.size,
      })),
      shippingAddress: address,
      paymentMethod,
      paymentId,
      paymentStatus: paymentId ? 'paid' : 'pending',
      couponCode: couponApplied ? couponCode : '',
      couponDiscount,
      subtotal,
      shippingCharge: shipping,
      totalAmount: finalTotal,
    };

    const result = await dispatch(createOrder(orderData));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(clearCart());
      setActiveStep(2);
      setTimeout(() => navigate('/orders'), 2000);
    }
  };

  const handlePayment = async () => {
    if (!validateAddress()) {
      toast.error('Please fill all address fields');
      return;
    }

    if (paymentMethod === 'cod') {
      await placeOrder();
      return;
    }

    // Razorpay Payment
    try {
      const res = await axiosInstance.post('/payment/create-order', { amount: finalTotal });
      const { order, key } = res.data;

      initRazorpayPayment({
        amount: finalTotal,
        orderId: order.id,
        key,
        user,
        onSuccess: async (response) => {
          await placeOrder(response.razorpay_payment_id);
          // Verify payment
          try {
            await axiosInstance.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (e) {}
        },
        onFailure: (msg) => toast.error(`Payment failed: ${msg}`),
      });
    } catch (err) {
      toast.error('Failed to initiate payment');
    }
  };

  if (!items || items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={800} gutterBottom>Checkout</Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {activeStep === 2 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'white', borderRadius: 3 }}>
            <Typography variant="h1" mb={2}>🎉</Typography>
            <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>Order Placed!</Typography>
            <Typography color="text.secondary" mb={3}>
              Thank you for your order! You'll receive a confirmation email shortly.
            </Typography>
            <CircularProgress size={30} />
            <Typography variant="body2" color="text.secondary" mt={2}>Redirecting to orders...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {/* Address Form */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>📍 Shipping Address</Typography>
                  <Grid container spacing={2}>
                    {[
                      { name: 'fullName', label: 'Full Name', xs: 12, md: 6 },
                      { name: 'phone', label: 'Phone Number', xs: 12, md: 6 },
                      { name: 'street', label: 'Street Address', xs: 12, md: 12 },
                      { name: 'city', label: 'City', xs: 12, md: 4 },
                      { name: 'state', label: 'State', xs: 12, md: 4 },
                      { name: 'pincode', label: 'Pincode', xs: 12, md: 4 },
                    ].map((field) => (
                      <Grid item xs={field.xs} md={field.md} key={field.name}>
                        <TextField
                          fullWidth label={field.label} name={field.name}
                          value={address[field.name]}
                          onChange={handleAddressChange}
                          size="small" required
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>💳 Payment Method</Typography>
                  <FormControl>
                    <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <FormControlLabel
                        value="razorpay"
                        control={<Radio color="primary" />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>Razorpay</Typography>
                            <Chip label="Recommended" size="small" color="success" />
                            <Typography variant="caption" color="text.secondary">
                              (Cards, UPI, Net Banking, Wallets)
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="cod"
                        control={<Radio color="primary" />}
                        label="Cash on Delivery (COD)"
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 80 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>📋 Order Summary</Typography>
                  <Divider sx={{ mb: 2 }} />

                  {/* Cart Items */}
                  {items.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {item.name} × {item.quantity}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice((item.finalPrice || item.price) * item.quantity)}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography>{formatPrice(subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Shipping</Typography>
                    <Typography color={shipping === 0 ? 'success.main' : 'inherit'}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </Typography>
                  </Box>
                  {couponDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="success.main">Coupon Discount</Typography>
                      <Typography color="success.main">-{formatPrice(couponDiscount)}</Typography>
                    </Box>
                  )}

                  {/* Coupon */}
                  <Divider sx={{ my: 2 }} />
                  {!couponApplied ? (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth size="small" placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 } }}
                      />
                      <Button variant="outlined" onClick={handleApplyCoupon} disabled={couponLoading} sx={{ minWidth: 80 }}>
                        Apply
                      </Button>
                    </Box>
                  ) : (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Coupon <strong>{couponCode}</strong> applied! 🎉
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Total</Typography>
                    <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(finalTotal)}</Typography>
                  </Box>

                  <Button
                    variant="contained" fullWidth size="large"
                    onClick={handlePayment} disabled={loading}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : `Place Order • ${formatPrice(finalTotal)}`}
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

export default Checkout;
