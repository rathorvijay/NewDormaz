import React from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormGroup, FormControlLabel, Slider, Divider, Button, Chip
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

const categories = ['Luxury', 'Ortho', 'Premium', 'Memory', 'Spring'];
const sizes = ['Single', 'Double', 'Queen', 'King', 'Custom'];

const ProductFilter = ({ filters, onChange, onReset }) => {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <Box sx={{ p: 2, background: 'white', borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight={700}>Filters</Typography>
        </Box>
        <Button size="small" onClick={onReset} sx={{ color: 'error.main' }}>Reset</Button>
      </Box>

      {/* Category */}
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Category</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            clickable
            onClick={() => handleChange('category', filters.category === cat ? '' : cat)}
            color={filters.category === cat ? 'primary' : 'default'}
            variant={filters.category === cat ? 'filled' : 'outlined'}
            size="small"
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Size */}
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Size</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {sizes.map((size) => (
          <Chip
            key={size}
            label={size}
            clickable
            onClick={() => handleChange('size', filters.size === size ? '' : size)}
            color={filters.size === size ? 'secondary' : 'default'}
            variant={filters.size === size ? 'filled' : 'outlined'}
            size="small"
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Price Range */}
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Price Range: ₹{filters.minPrice?.toLocaleString()} - ₹{filters.maxPrice?.toLocaleString()}
      </Typography>
      <Slider
        value={[filters.minPrice || 0, filters.maxPrice || 100000]}
        onChange={(e, val) => { handleChange('minPrice', val[0]); handleChange('maxPrice', val[1]); }}
        min={0} max={100000} step={1000}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `₹${v.toLocaleString()}`}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* Sort */}
      <FormControl fullWidth size="small">
        <InputLabel>Sort By</InputLabel>
        <Select
          value={filters.sort || ''}
          onChange={(e) => handleChange('sort', e.target.value)}
          label="Sort By"
        >
          <MenuItem value="">Default</MenuItem>
          <MenuItem value="price-asc">Price: Low to High</MenuItem>
          <MenuItem value="price-desc">Price: High to Low</MenuItem>
          <MenuItem value="rating">Best Rated</MenuItem>
          <MenuItem value="newest">Newest First</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default ProductFilter;
