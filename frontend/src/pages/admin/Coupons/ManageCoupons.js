import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Tooltip, Switch, Select, MenuItem, FormControl, InputLabel, Alert
} from '@mui/material';
import { Add, Delete, ToggleOn } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllCoupons, createCoupon, deleteCoupon } from '../../../redux/adminSlice';
import axiosInstance from '../../../api/axiosInstance';
import Loader from '../../../components/Loader';
import toast from 'react-hot-toast';

const ManageCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading } = useSelector((state) => state.admin);

  const [form, setForm] = useState({
    code: '', discount: '', discountType: 'percentage',
    minOrderAmount: '', maxDiscount: '', expiryDate: '', usageLimit: '',
  });

  useEffect(() => { dispatch(fetchAllCoupons()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createCoupon(form));
    if (result.meta.requestStatus === 'fulfilled') {
      setForm({ code: '', discount: '', discountType: 'percentage', minOrderAmount: '', maxDiscount: '', expiryDate: '', usageLimit: '' });
    }
  };

  const handleToggle = async (id) => {
    try {
      await axiosInstance.put(`/coupons/${id}/toggle`);
      dispatch(fetchAllCoupons());
      toast.success('Coupon status updated');
    } catch (err) {
      toast.error('Failed to toggle coupon');
    }
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>Manage Coupons</Typography>

      <Grid container spacing={3}>
        {/* Create Coupon Form */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Create New Coupon</Typography>
              <form onSubmit={handleCreate}>
                <TextField fullWidth label="Coupon Code" name="code" value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  sx={{ mb: 2 }} required placeholder="e.g. DORMEZ10"
                  inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 } }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Discount Type</InputLabel>
                  <Select name="discountType" value={form.discountType} onChange={handleChange} label="Discount Type">
                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label={`Discount ${form.discountType === 'percentage' ? '(%)' : '(₹)'}`}
                  name="discount" type="number" value={form.discount} onChange={handleChange} sx={{ mb: 2 }} required />
                <TextField fullWidth label="Min Order Amount (₹)" name="minOrderAmount" type="number"
                  value={form.minOrderAmount} onChange={handleChange} sx={{ mb: 2 }} />
                {form.discountType === 'percentage' && (
                  <TextField fullWidth label="Max Discount (₹)" name="maxDiscount" type="number"
                    value={form.maxDiscount} onChange={handleChange} sx={{ mb: 2 }} />
                )}
                <TextField fullWidth label="Expiry Date" name="expiryDate" type="date"
                  value={form.expiryDate} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} required />
                <TextField fullWidth label="Usage Limit (optional)" name="usageLimit" type="number"
                  value={form.usageLimit} onChange={handleChange} sx={{ mb: 2 }} />
                <Button type="submit" variant="contained" fullWidth startIcon={<Add />}>
                  Create Coupon
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Coupons List */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Discount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Min Order</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Used</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id} hover>
                    <TableCell>
                      <Typography fontFamily="monospace" fontWeight={700} color="primary">
                        {coupon.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} color="success.main">
                        {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                      </Typography>
                    </TableCell>
                    <TableCell>₹{coupon.minOrderAmount || 0}</TableCell>
                    <TableCell>
                      <Typography variant="body2"
                        color={new Date(coupon.expiryDate) < new Date() ? 'error.main' : 'text.primary'}>
                        {new Date(coupon.expiryDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>{coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={coupon.active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Toggle Status">
                        <Switch checked={coupon.active} onChange={() => handleToggle(coupon._id)} color="success" size="small" />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => dispatch(deleteCoupon(coupon._id))}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManageCoupons;
