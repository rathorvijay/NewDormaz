import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Autorenew, Cancel, CloudUpload } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { cancelOrder, createReturnRequest, fetchOrderById, fetchMyOrders } from '../../../redux/orderSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const trackingSteps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const statusColors = {
  Requested: 'warning',
  Approved: 'info',
  Rejected: 'error',
  'Pickup Scheduled': 'secondary',
  'Picked from customer': 'secondary',
  'Received at warehouse': 'secondary',
  'Quality Check Passed': 'success',
  'Quality Check Failed': 'error',
  'Refund Initiated': 'success',
  'Replacement Shipped': 'success',
  Completed: 'success',
};

const getReturnFlowSteps = (resolutionType) => [
  'Requested',
  'Approved',
  'Pickup Scheduled',
  'Picked from customer',
  'Received at warehouse',
  'Quality Check Passed',
  resolutionType === 'replacement' ? 'Replacement Shipped' : 'Refund Initiated',
  'Completed',
];

const OrderTracking = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedOrder: order, loading, returnSubmitting } = useSelector((state) => state.orders);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnForm, setReturnForm] = useState({
    reason: 'Damaged',
    resolutionType: 'refund',
    comments: '',
    refundMode: 'original_source',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [proofImages, setProofImages] = useState([]);

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  const currentStep = order?.orderStatus === 'Cancelled' ? -1 : trackingSteps.indexOf(order?.orderStatus);
  const isCancellable = ['Order Placed', 'Packed'].includes(order?.orderStatus);

  const isCodRefund = useMemo(
    () => order?.paymentMethod === 'cod' && returnForm.resolutionType === 'refund',
    [order?.paymentMethod, returnForm.resolutionType]
  );

  if (loading || !order) return <Loader message="Loading order..." />;

  const handleOpenReturnDialog = (item) => {
    setSelectedItem(item);
    setProofImages([]);
    setReturnForm({
      reason: 'Damaged',
      resolutionType: 'refund',
      comments: '',
      refundMode: order.paymentMethod === 'cod' ? 'bank_account' : 'original_source',
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
    });
    setDialogOpen(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedItem) return;
    const formData = new FormData();
    formData.append('orderItemId', selectedItem._id);
    formData.append('reason', returnForm.reason);
    formData.append('resolutionType', returnForm.resolutionType);
    formData.append('comments', returnForm.comments);
    formData.append('refundMode', returnForm.refundMode);
    if (isCodRefund) {
      formData.append('accountHolderName', returnForm.accountHolderName);
      formData.append('bankName', returnForm.bankName);
      formData.append('accountNumber', returnForm.accountNumber);
      formData.append('ifscCode', returnForm.ifscCode);
    }
    proofImages.forEach((file) => formData.append('images', file));

    const result = await dispatch(createReturnRequest({ orderId: order._id, formData }));
    if (result.meta.requestStatus === 'fulfilled') {
      setDialogOpen(false);
      dispatch(fetchOrderById(order._id));
      dispatch(fetchMyOrders());
    }
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')}>Back to Orders</Button>
          <Typography variant="h5" fontWeight={800}>Order #{order._id.slice(-8).toUpperCase()}</Typography>
          <Chip label={order.orderStatus} color={order.orderStatus === 'Delivered' ? 'success' : order.orderStatus === 'Cancelled' ? 'error' : 'primary'} />
        </Box>

        <Grid container spacing={3}>
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

          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Order Items & Returns</Typography>
                {order.products.map((item, i) => {
                  const existingReturn = order.returnRequests?.find((request) => request.orderItemId === item._id || request.orderItemId?._id === item._id || request.orderItemId?.toString?.() === item._id);
                  const flowSteps = getReturnFlowSteps(existingReturn?.resolutionType);
                  const returnStep = existingReturn ? flowSteps.indexOf(existingReturn.status) : -1;

                  return (
                    <Box key={item._id || i} sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar src={item.image} variant="rounded" sx={{ width: 64, height: 64 }}>📦</Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={700}>{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Size: {item.size} • Qty: {item.quantity}</Typography>
                          <Typography variant="h6" color="primary" fontWeight={700}>{formatPrice(item.price)}</Typography>
                        </Box>
                        <Typography fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                        {item.returnMeta?.eligible && (
                          <Chip color="success" icon={<Autorenew />} label={item.returnMeta.countdownText} />
                        )}
                        {item.returnMeta?.deadlineText && !item.returnMeta?.existingReturn && (
                          <Chip variant="outlined" label={`Return till ${item.returnMeta.deadlineText}`} />
                        )}
                        {!item.returnMeta?.eligible && item.returnMeta?.message && (
                          <Chip variant="outlined" label={item.returnMeta.message} />
                        )}
                        {item.returnMeta?.existingReturn && (
                          <Chip color={statusColors[item.returnMeta.existingReturn.status] || 'default'} label={`Return ${item.returnMeta.existingReturn.status}`} />
                        )}
                      </Stack>

                      {item.returnMeta?.eligible && (
                        <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => handleOpenReturnDialog(item)}>
                          Return / Replace Item
                        </Button>
                      )}

                      {existingReturn && (
                        <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: '#fafbff' }}>
                          <Typography fontWeight={700} gutterBottom>Return Timeline</Typography>
                          {existingReturn.status === 'Rejected' || existingReturn.status === 'Quality Check Failed' ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                              {existingReturn.status}. {existingReturn.timeline?.[existingReturn.timeline.length - 1]?.note || 'Please contact support for details.'}
                            </Alert>
                          ) : (
                            <Stepper activeStep={returnStep} alternativeLabel sx={{ mb: 2 }}>
                              {flowSteps.map((step, index) => (
                                <Step key={step} completed={index <= returnStep}>
                                  <StepLabel>{step}</StepLabel>
                                </Step>
                              ))}
                            </Stepper>
                          )}
                          <List dense>
                            {(existingReturn.timeline || []).map((entry, entryIndex) => (
                              <ListItem key={`${entry.status}-${entryIndex}`} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={entry.status}
                                  secondary={`${new Date(entry.timestamp).toLocaleString('en-IN')}${entry.note ? ` • ${entry.note}` : ''}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {i < order.products.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  );
                })}
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
                  <Chip label={order.paymentStatus} size="small" color={order.paymentStatus === 'paid' ? 'success' : 'warning'} />
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

            {isCancellable && (
              <Button variant="outlined" color="error" fullWidth startIcon={<Cancel />} onClick={() => dispatch(cancelOrder(order._id))}>
                Cancel Order
              </Button>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Raise Return Request</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Eligible only for delivered, returnable items within the return window. Proof image is required for damaged or wrong item claims.
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Return Reason</InputLabel>
            <Select
              label="Return Reason"
              value={returnForm.reason}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
            >
              {['Damaged', 'Wrong item', 'Not satisfied', 'Quality issue', 'Other'].map((reason) => (
                <MenuItem key={reason} value={reason}>{reason}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Resolution Type</InputLabel>
            <Select
              label="Resolution Type"
              value={returnForm.resolutionType}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, resolutionType: e.target.value }))}
            >
              <MenuItem value="refund">Refund</MenuItem>
              <MenuItem value="replacement">Replacement</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments"
            value={returnForm.comments}
            onChange={(e) => setReturnForm((prev) => ({ ...prev, comments: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ mb: 2 }}>
            Upload Proof Images
            <input hidden multiple accept="image/*" type="file" onChange={(e) => setProofImages(Array.from(e.target.files || []))} />
          </Button>
          {proofImages.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {proofImages.length} image(s) selected
            </Typography>
          )}

          {isCodRefund && (
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa' }}>
              <Typography fontWeight={700} gutterBottom>COD Refund Bank Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Account Holder Name" value={returnForm.accountHolderName} onChange={(e) => setReturnForm((prev) => ({ ...prev, accountHolderName: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Bank Name" value={returnForm.bankName} onChange={(e) => setReturnForm((prev) => ({ ...prev, bankName: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Account Number" value={returnForm.accountNumber} onChange={(e) => setReturnForm((prev) => ({ ...prev, accountNumber: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="IFSC Code" value={returnForm.ifscCode} onChange={(e) => setReturnForm((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReturn} variant="contained" disabled={returnSubmitting}>
            {returnSubmitting ? 'Submitting...' : 'Submit Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const Container = ({ children, ...props }) => <Box component="div" {...props}>{children}</Box>;

export default OrderTracking;
