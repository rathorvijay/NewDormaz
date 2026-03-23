import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  CircularProgress, Alert
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, updateProduct } from '../../../redux/productSlice';
import Loader from '../../../components/Loader';

const EditProduct = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((state) => state.products);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', category: '', size: '', thickness: '', price: '',
    discount: 0, stock: '', description: '', features: '', tags: '', isFeatured: false,
  });

  useEffect(() => {
    dispatch(fetchProductById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        size: product.size || '',
        thickness: product.thickness || '',
        price: product.price || '',
        discount: product.discount || 0,
        stock: product.stock || '',
        description: product.description || '',
        features: Array.isArray(product.features) ? product.features.join('\n') : '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        isFeatured: product.isFeatured || false,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      const result = await dispatch(updateProduct({ id, formData }));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/admin/products');
      } else {
        setError(result.payload || 'Failed to update');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !product) return <Loader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/products')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Edit Product</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Product Name" name="name" value={form.name} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select name="category" value={form.category} onChange={handleChange} label="Category">
                    {['Luxury', 'Ortho', 'Premium', 'Memory', 'Spring'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Size</InputLabel>
                  <Select name="size" value={form.size} onChange={handleChange} label="Size">
                    {['Single', 'Double', 'Queen', 'King', 'Custom'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Thickness" name="thickness" value={form.thickness} onChange={handleChange} required />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required />
              </Grid>
              <Grid item xs={3}>
                <TextField fullWidth label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Tags" name="tags" value={form.tags} onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Features (one per line)" name="features" value={form.features} onChange={handleChange} multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" name="description" value={form.description} onChange={handleChange} multiline rows={4} required />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch name="isFeatured" checked={form.isFeatured} onChange={handleChange} color="secondary" />}
                  label="Featured Product"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Button
          type="submit" variant="contained" size="large" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={saving} sx={{ mt: 2, px: 4 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Box>
  );
};

export default EditProduct;
