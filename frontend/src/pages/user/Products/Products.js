import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, TextField, InputAdornment,
  Drawer, IconButton, useTheme, useMediaQuery, Button, Chip
} from '@mui/material';
import { Search, FilterList, Close } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../../../redux/productSlice';
import ProductCard from '../../../components/ProductCard';
import ProductFilter from '../../../components/ProductFilter';
import Loader from '../../../components/Loader';
import Pagination from '../../../components/Pagination';

const defaultFilters = { category: '', size: '', minPrice: 0, maxPrice: 100000, sort: '' };

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: searchParams.get('category') || '',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { products, total, pages, loading } = useSelector((state) => state.products);

  const loadProducts = useCallback(() => {
    const params = { page, limit: 12 };
    if (search) params.keyword = search;
    if (filters.category) params.category = filters.category;
    if (filters.size) params.size = filters.size;
    if (filters.minPrice > 0) params.minPrice = filters.minPrice;
    if (filters.maxPrice < 100000) params.maxPrice = filters.maxPrice;
    if (filters.sort) params.sort = filters.sort;
    dispatch(fetchProducts(params));
  }, [dispatch, search, filters, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSearch('');
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 0 && v !== 100000).length;

  const filterPanel = (
    <ProductFilter filters={filters} onChange={handleFilterChange} onReset={handleReset} />
  );

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>Our Mattresses</Typography>
          <Typography color="text.secondary">{total} products found</Typography>
        </Box>

        {/* Search Bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth placeholder="Search mattresses by name, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearch(''); setPage(1); }}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: 'white', borderRadius: 2 }}
          />
          <Button type="submit" variant="contained" sx={{ px: 4, minWidth: 120 }}>Search</Button>
          {isMobile && (
            <Button
              variant="outlined" startIcon={<FilterList />}
              onClick={() => setDrawerOpen(true)}
              sx={{ minWidth: 100 }}
            >
              Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          )}
        </Box>

        {/* Active Filters Chips */}
        {(filters.category || filters.size) && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {filters.category && (
              <Chip label={`Category: ${filters.category}`} onDelete={() => setFilters({ ...filters, category: '' })} color="primary" variant="outlined" />
            )}
            {filters.size && (
              <Chip label={`Size: ${filters.size}`} onDelete={() => setFilters({ ...filters, size: '' })} color="secondary" variant="outlined" />
            )}
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Desktop Filter Sidebar */}
          {!isMobile && (
            <Grid item md={3}>
              {filterPanel}
            </Grid>
          )}

          {/* Products Grid */}
          <Grid item xs={12} md={9}>
            {loading ? <Loader message="Loading mattresses..." /> : (
              <>
                {products.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h2">😔</Typography>
                    <Typography variant="h5" fontWeight={600} mt={2}>No products found</Typography>
                    <Typography color="text.secondary" mb={3}>Try adjusting your filters or search terms</Typography>
                    <Button variant="contained" onClick={handleReset}>Clear Filters</Button>
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={3}>
                      {products.map((product) => (
                        <Grid item xs={12} sm={6} md={4} key={product._id}>
                          <ProductCard product={product} />
                        </Grid>
                      ))}
                    </Grid>
                    <Pagination page={page} pages={pages} onChange={setPage} />
                  </>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {/* Mobile Filter Drawer */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 300, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Filters</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
            </Box>
            {filterPanel}
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => setDrawerOpen(false)}>Apply Filters</Button>
          </Box>
        </Drawer>
      </Container>
    </Box>
  );
};

export default Products;
