import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrderStatus, handleReturnAction } from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';
import Pagination from '../../../components/Pagination';
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

const statuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const ManageOrders = () => {
  const dispatch = useDispatch();
  const { orders, total, pages, loading } = useSelector((state) => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialog, setDialog] = useState({ open: false, id: '', action: '', note: '' });

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 10, ...(statusFilter && { status: statusFilter }) }));
  }, [dispatch, page, statusFilter]);

  if (loading) return <Loader />;

  const openActionDialog = (id, action) => setDialog({ open: true, id, action, note: '' });
  const closeDialog = () => setDialog({ open: false, id: '', action: '', note: '' });

  const submitReturnAction = async () => {
    const result = await dispatch(handleReturnAction({ id: dialog.id, action: dialog.action, adminNote: dialog.note }));
    if (result.meta.requestStatus === 'fulfilled') closeDialog();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Manage Orders ({total})</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} displayEmpty>
            <MenuItem value="">All Statuses</MenuItem>
            {['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Return Rejected', 'Refunded'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
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
              <TableCell sx={{ fontWeight: 700 }}>Return / Refund</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const lockStatusUpdate = ['Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Return Rejected', 'Refunded'].includes(order.orderStatus);
              const paymentColor = order.paymentStatus === 'paid' || order.paymentStatus === 'refunded'
                ? 'success'
                : order.paymentStatus === 'pending' || order.paymentStatus === 'refund_pending'
                  ? 'warning'
                  : 'error';

              return (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>#{order._id.slice(-8).toUpperCase()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.userId?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.userId?.email}</Typography>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="primary">{formatPrice(order.totalAmount)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={order.paymentStatus} size="small" color={paymentColor} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={order.orderStatus} size="small" color={statusColors[order.orderStatus] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <Select
                        value={statuses.includes(order.orderStatus) ? order.orderStatus : ''}
                        displayEmpty
                        onChange={(e) => dispatch(updateOrderStatus({ id: order._id, orderStatus: e.target.value }))}
                        disabled={lockStatusUpdate}
                      >
                        <MenuItem value="" disabled>Select status</MenuItem>
                        {statuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      {order.returnRequest?.status === 'requested' && (
                        <>
                          <Button size="small" variant="contained" onClick={() => openActionDialog(order._id, 'approve')}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => openActionDialog(order._id, 'reject')}>Reject</Button>
                        </>
                      )}
                      {order.returnRequest?.status === 'approved' && order.paymentStatus === 'refund_pending' && (
                        <Button size="small" variant="contained" color="success" onClick={() => openActionDialog(order._id, 'refund')}>
                          Mark Refunded
                        </Button>
                      )}
                      {order.returnRequest?.status === 'none' && <Typography variant="caption" color="text.secondary">No return request</Typography>}
                      {order.returnRequest?.status === 'refunded' && <Chip label="Refunded" size="small" color="success" />}
                      {order.returnRequest?.status === 'rejected' && <Chip label="Rejected" size="small" color="error" variant="outlined" />}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination page={page} pages={pages} onChange={setPage} />

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialog.action === 'approve' && 'Approve Return Request'}
          {dialog.action === 'reject' && 'Reject Return Request'}
          {dialog.action === 'refund' && 'Mark Refund Complete'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Admin note"
            value={dialog.note}
            onChange={(e) => setDialog((prev) => ({ ...prev, note: e.target.value }))}
            sx={{ mt: 1 }}
            placeholder="Optional note visible in return status communication"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitReturnAction}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageOrders;
