import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Select, MenuItem, FormControl,
  TextField, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus } from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';
import Pagination from '../../../components/Pagination';
import { formatPrice } from '../../../utils/formatPrice';

const statusColors = {
  'Order Placed': 'info', 'Packed': 'warning', 'Shipped': 'secondary',
  'Out for Delivery': 'primary', 'Delivered': 'success', 'Cancelled': 'error',
};

const statuses = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const ManageOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, total, pages, loading } = useSelector((state) => state.admin);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 10, ...(statusFilter && { status: statusFilter }) }));
  }, [dispatch, page, statusFilter]);

  if (loading) return <Loader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Manage Orders ({total})</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} displayEmpty>
            <MenuItem value="">All Statuses</MenuItem>
            {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
              <TableCell sx={{ fontWeight: 700 }}>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                    #{order._id.slice(-8).toUpperCase()}
                  </Typography>
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
                  <Chip label={order.paymentStatus} size="small"
                    color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'pending' ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip label={order.orderStatus} size="small" color={statusColors[order.orderStatus] || 'default'} />
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={order.orderStatus}
                      onChange={(e) => dispatch(updateOrderStatus({ id: order._id, orderStatus: e.target.value }))}
                      disabled={['Delivered', 'Cancelled'].includes(order.orderStatus)}
                    >
                      {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/orders/${order._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </Box>
  );
};

export default ManageOrders;
