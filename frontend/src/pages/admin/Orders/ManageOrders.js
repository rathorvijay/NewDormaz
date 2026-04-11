import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllOrders,
  fetchReturnRequests,
  updateOrderStatus,
  updateReturnRequestStatus,
} from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';
import Pagination from '../../../components/Pagination';
import { formatPrice } from '../../../utils/formatPrice';

const orderStatuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const returnStatuses = [
  'Requested',
  'Approved',
  'Rejected',
  'Pickup Scheduled',
  'Picked from customer',
  'Received at warehouse',
  'Quality Check Passed',
  'Quality Check Failed',
  'Refund Initiated',
  'Replacement Shipped',
  'Completed',
];

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

const ManageOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, total, pages, returnRequests, returnTotal, returnPages, loading } = useSelector((state) => state.admin);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [returnPage, setReturnPage] = useState(1);
  const [returnStatusFilter, setReturnStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updatePayload, setUpdatePayload] = useState({ status: 'Approved', note: '', scheduledFor: '' });

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 10, ...(statusFilter && { status: statusFilter }) }));
    dispatch(
      fetchReturnRequests({
        page: returnPage,
        limit: 10,
        ...(returnStatusFilter && { status: returnStatusFilter }),
        ...(riskFilter && { risk: riskFilter }),
      })
    );
  }, [dispatch, page, statusFilter, returnPage, returnStatusFilter, riskFilter]);

  const returnSummary = useMemo(() => {
    const openStatuses = ['Requested', 'Approved', 'Pickup Scheduled'];
    return {
      open: returnRequests.filter((item) => openStatuses.includes(item.status)).length,
      highRisk: returnRequests.filter((item) => item.fraudSignals?.highRisk).length,
    };
  }, [returnRequests]);

  const openUpdateDialog = (request) => {
    setSelectedReturn(request);
    setUpdatePayload({ status: request.status, note: '', scheduledFor: '' });
  };

  const handleUpdateReturn = async () => {
    if (!selectedReturn) return;
    const result = await dispatch(
      updateReturnRequestStatus({
        id: selectedReturn._id,
        payload: updatePayload,
      })
    );
    if (result.meta.requestStatus === 'fulfilled') {
      setSelectedReturn(null);
      dispatch(
        fetchReturnRequests({
          page: returnPage,
          limit: 10,
          ...(returnStatusFilter && { status: returnStatusFilter }),
          ...(riskFilter && { risk: riskFilter }),
        })
      );
    }
  };

  if (loading && !orders.length) return <Loader />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Manage Orders & Returns</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">Total Orders</Typography>
            <Typography variant="h5" fontWeight={800}>{total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">Open Returns</Typography>
            <Typography variant="h5" fontWeight={800}>{returnSummary.open}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">High Risk Returns</Typography>
            <Typography variant="h5" fontWeight={800}>{returnSummary.highRisk}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} displayEmpty>
            <MenuItem value="">All Order Statuses</MenuItem>
            {orderStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Update Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={600}>#{order._id.slice(-8).toUpperCase()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{order.userId?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{order.userId?.email}</Typography>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                <TableCell><Typography fontWeight={700} color="primary">{formatPrice(order.totalAmount)}</Typography></TableCell>
                <TableCell>
                  <Chip label={order.paymentStatus} size="small" color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={order.orderStatus} size="small" color={order.orderStatus === 'Delivered' ? 'success' : 'primary'} />
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select value={order.orderStatus} onChange={(e) => dispatch(updateOrderStatus({ id: order._id, orderStatus: e.target.value }))} disabled={['Delivered', 'Cancelled'].includes(order.orderStatus)}>
                      {orderStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button size="small" startIcon={<Visibility />} onClick={() => navigate(`/orders/${order._id}`)}>Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination page={page} pages={pages} onChange={setPage} />

      <Box sx={{ mt: 5, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={800}>Return Requests ({returnTotal})</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={returnStatusFilter} onChange={(e) => { setReturnStatusFilter(e.target.value); setReturnPage(1); }}>
              <MenuItem value="">All Return Statuses</MenuItem>
              {returnStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Risk</InputLabel>
            <Select label="Risk" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setReturnPage(1); }}>
              <MenuItem value="">All Risk Levels</MenuItem>
              <MenuItem value="high">High Risk Only</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9ff' }}>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Resolution</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fraud Check</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Proof</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returnRequests.map((request) => (
              <TableRow key={request._id} hover>
                <TableCell>
                  <Typography fontWeight={700}>{request.productSnapshot?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Order #{request.orderId?._id?.slice?.(-8)?.toUpperCase?.() || ''}</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{request.userId?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{request.userId?.email}</Typography>
                </TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{request.resolutionType}</TableCell>
                <TableCell>
                  <Chip label={request.status} size="small" color={statusColors[request.status] || 'default'} />
                </TableCell>
                <TableCell>
                  {request.fraudSignals?.highRisk ? (
                    <Chip color="error" size="small" label={request.fraudSignals.reason || 'High Risk'} />
                  ) : (
                    <Chip color="success" size="small" label="Normal" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  {request.proofImages?.length ? (
                    <Typography variant="caption">{request.proofImages.length} image(s)</Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No proof</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => openUpdateDialog(request)}>Update</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination page={returnPage} pages={returnPages} onChange={setReturnPage} />

      <Dialog open={Boolean(selectedReturn)} onClose={() => setSelectedReturn(null)} fullWidth maxWidth="sm">
        <DialogTitle>Update Return Request</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={updatePayload.status} onChange={(e) => setUpdatePayload((prev) => ({ ...prev, status: e.target.value }))}>
              {returnStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={3} label="Admin Note" value={updatePayload.note} onChange={(e) => setUpdatePayload((prev) => ({ ...prev, note: e.target.value }))} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="Pickup Schedule"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={updatePayload.scheduledFor}
            onChange={(e) => setUpdatePayload((prev) => ({ ...prev, scheduledFor: e.target.value }))}
            helperText="Use this when moving status to Pickup Scheduled."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReturn(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateReturn}>Save Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageOrders;
