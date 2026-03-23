import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../../../redux/productSlice';
import Loader from '../../../components/Loader';
import Pagination from '../../../components/Pagination';
import { formatPrice } from '../../../utils/formatPrice';
import toast from 'react-hot-toast';

const ManageProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, total, pages, loading } = useSelector((state) => state.products);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const params = { page, limit: 10 };
    if (search) params.keyword = search;
    if (category) params.category = category;
    dispatch(fetchProducts(params));
  }, [dispatch, page, search, category]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const result = await dispatch(deleteProduct(id));
      if (result.meta.requestStatus === 'fulfilled') toast.success('Product deleted');
    }
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Manage Products ({total})</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/products/add')}>
          Add Product
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Search products..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} label="Category">
            <MenuItem value="">All</MenuItem>
            {['Luxury', 'Ortho', 'Premium', 'Memory', 'Spring'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={product.images[0]?.url}
                      variant="rounded"
                      sx={{ width: 48, height: 48 }}
                    >📦</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                        {product.name}
                      </Typography>
                      {product.isFeatured && <Chip label="Featured" size="small" color="secondary" sx={{ fontSize: '9px', height: 16 }} />}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Chip label={product.category} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell>{product.size}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} color="primary">{formatPrice(product.finalPrice)}</Typography>
                  {product.discount > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      {formatPrice(product.price)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} color={product.stock <= 5 ? 'error.main' : 'text.primary'}>
                      {product.stock}
                    </Typography>
                    {product.stock <= 5 && <Warning fontSize="small" color="warning" />}
                  </Box>
                </TableCell>
                <TableCell>⭐ {product.rating} ({product.numReviews})</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => navigate(`/admin/products/edit/${product._id}`)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(product._id, product.name)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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

export default ManageProducts;
