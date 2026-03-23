import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  CircularProgress, IconButton, Alert
} from '@mui/material';
import { ArrowBack, CloudUpload, Delete } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../../redux/productSlice';

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
    name: '', category: '', size: '', thickness: '', price: '',
    discount: 0, stock: '', description: '', features: '', tags: '', isFeatured: false,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach(img => formData.append('images', img));

      const result = await dispatch(createProduct(formData));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/admin/products');
      } else {
        setError(result.payload || 'Failed to create product');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/products')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Add New Product</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Product Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Product Name" name="name" value={form.name}
                      onChange={handleChange} required />
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
                    <TextField fullWidth label="Thickness (e.g. 6 inch)" name="thickness" value={form.thickness} onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField fullWidth label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField fullWidth label="Discount (%)" name="discount" type="number" value={form.discount} onChange={handleChange} inputProps={{ min: 0, max: 100 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Stock Quantity" name="stock" type="number" value={form.stock} onChange={handleChange} required />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="comfort,ortho,luxury" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Features (one per line)" name="features" value={form.features}
                      onChange={handleChange} multiline rows={3} placeholder="Premium foam&#10;5 year warranty&#10;Easy to clean" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Description" name="description" value={form.description}
                      onChange={handleChange} multiline rows={4} required />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch name="isFeatured" checked={form.isFeatured} onChange={handleChange} color="secondary" />}
                      label="Mark as Featured Product"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Product Images</Typography>
                <Button
                  variant="outlined" fullWidth startIcon={<CloudUpload />}
                  component="label" sx={{ mb: 2 }}
                >
                  Upload Images
                  <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                </Button>
                <Grid container spacing={1}>
                  {previews.map((preview, i) => (
                    <Grid item xs={6} key={i}>
                      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', height: 100 }}>
                        <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                          onClick={() => {
                            const newImages = images.filter((_, idx) => idx !== i);
                            setImages(newImages);
                            setPreviews(previews.filter((_, idx) => idx !== i));
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {previews.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #e0e0e0', borderRadius: 2 }}>
                    <Typography color="text.secondary">Upload up to 5 images</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading} sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Product'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AddProduct;
