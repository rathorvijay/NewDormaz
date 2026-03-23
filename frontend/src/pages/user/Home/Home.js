import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Avatar, Rating, useTheme, useMediaQuery
} from '@mui/material';
import {
  Star, LocalShipping, Verified, SupportAgent, 
  ArrowForward, Bedtime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedProducts } from '../../../redux/productSlice';
import ProductCard from '../../../components/ProductCard';
import Loader from '../../../components/Loader';

const categories = [
  { name: 'Luxury', color: '#7b1fa2', desc: 'Ultimate comfort & style', emoji: '👑' },
  { name: 'Ortho', color: '#1565c0', desc: 'Medical grade support', emoji: '🏥' },
  { name: 'Premium', color: '#2e7d32', desc: 'Best value for money', emoji: '⭐' },
  { name: 'Memory', color: '#e65100', desc: 'Body-conforming foam', emoji: '🧠' },
  { name: 'Spring', color: '#00695c', desc: 'Traditional bounce', emoji: '🌀' },
];

const features = [
  { icon: <Verified fontSize="large" />, title: '100% Genuine', desc: 'Certified quality products' },
  { icon: <LocalShipping fontSize="large" />, title: 'Free Delivery', desc: 'On orders above ₹5000' },
  { icon: <Star fontSize="large" />, title: '5 Year Warranty', desc: 'Peace of mind guaranteed' },
  { icon: <SupportAgent fontSize="large" />, title: '24/7 Support', desc: 'Always here for you' },
];

const testimonials = [
  { name: 'Priya Sharma', rating: 5, comment: 'Best mattress I ever bought! Sleep quality improved drastically.', city: 'Mumbai' },
  { name: 'Rahul Gupta', rating: 5, comment: 'The ortho mattress fixed my back pain. Highly recommended!', city: 'Delhi' },
  { name: 'Anita Singh', rating: 4, comment: 'Great quality and prompt delivery. Very satisfied with Dormez.', city: 'Bangalore' },
];

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { featuredProducts, loading } = useSelector((state) => state.products);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
  }, [dispatch]);

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
        minHeight: '90vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{
            position: 'absolute', borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            width: [300, 200, 400, 150, 250][i],
            height: [300, 200, 400, 150, 250][i],
            top: ['10%', '60%', '-10%', '30%', '70%'][i],
            left: ['70%', '80%', '-5%', '50%', '10%'][i],
          }} />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip label="🛏️ India's #1 Mattress Brand" sx={{ bgcolor: 'rgba(255,202,40,0.2)', color: '#ffca28', mb: 3, fontWeight: 600 }} />
              <Typography variant={isMobile ? 'h3' : 'h1'} fontWeight={900} color="white" sx={{ mb: 2, lineHeight: 1.1 }}>
                Sleep Better,<br />
                <Box component="span" sx={{ color: '#ffca28' }}>Live Better</Box>
              </Typography>
              <Typography variant="h6" sx={{ color: '#b3c5ff', mb: 4, fontWeight: 300, maxWidth: 500 }}>
                Discover our premium range of mattresses crafted for the perfect sleep experience. 
                Your dream sleep starts here. 🌙
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained" color="secondary" size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/products')}
                  sx={{ px: 4, py: 1.5, fontSize: 16, borderRadius: 3 }}
                >
                  Shop Now
                </Button>
                <Button
                  variant="outlined" size="large"
                  onClick={() => navigate('/products')}
                  sx={{ px: 4, py: 1.5, fontSize: 16, borderRadius: 3, borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                >
                  Explore All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 4, mt: 4 }}>
                {[{ num: '10K+', label: 'Happy Customers' }, { num: '50+', label: 'Products' }, { num: '5★', label: 'Rating' }].map((stat) => (
                  <Box key={stat.label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800} color="#ffca28">{stat.num}</Typography>
                    <Typography variant="caption" sx={{ color: '#b3c5ff' }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center' }}>
              <Bedtime sx={{ fontSize: 300, color: 'rgba(255,202,40,0.15)', position: 'absolute', right: -40, top: '50%', transform: 'translateY(-50%)' }} />
              <Box sx={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 6, p: 4,
                backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Bedtime sx={{ fontSize: 120, color: '#ffca28', mb: 2 }} />
                <Typography variant="h5" color="white" fontWeight={700}>Dormez Premium</Typography>
                <Typography color="#b3c5ff" mb={2}>Memory Foam Mattress</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Rating value={5} readOnly sx={{ color: '#ffca28' }} />
                </Box>
                <Typography variant="h4" color="#ffca28" fontWeight={800}>₹24,999</Typography>
                <Typography sx={{ textDecoration: 'line-through', color: '#b3c5ff' }}>₹34,999</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Strip */}
      <Box sx={{ bgcolor: 'white', py: 4, boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={6} md={3} key={f.title}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{f.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Categories */}
      <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>Shop by Category</Typography>
            <Typography color="text.secondary">Find the perfect mattress for your needs</Typography>
          </Box>
          <Grid container spacing={3}>
            {categories.map((cat) => (
              <Grid item xs={6} sm={4} md={2.4} key={cat.name}>
                <Card
                  sx={{
                    textAlign: 'center', p: 3, cursor: 'pointer', border: '2px solid transparent',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: cat.color, transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${cat.color}30` },
                  }}
                  onClick={() => navigate(`/products?category=${cat.name}`)}
                >
                  <Typography variant="h2" mb={1}>{cat.emoji}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: cat.color }}>{cat.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{cat.desc}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Products */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>Featured Mattresses</Typography>
              <Typography color="text.secondary">Handpicked bestsellers for you</Typography>
            </Box>
            <Button variant="outlined" endIcon={<ArrowForward />} onClick={() => navigate('/products')}>
              View All
            </Button>
          </Box>
          {loading ? <Loader message="Loading products..." /> : (
            <Grid container spacing={3}>
              {featuredProducts.slice(0, 4).map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 8, bgcolor: 'primary.main' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={800} color="white" gutterBottom>What Our Customers Say</Typography>
            <Typography sx={{ color: '#b3c5ff' }}>Trusted by thousands of happy sleepers</Typography>
          </Box>
          <Grid container spacing={3}>
            {testimonials.map((t) => (
              <Grid item xs={12} md={4} key={t.name}>
                <Card sx={{ p: 3, height: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <Rating value={t.rating} readOnly sx={{ color: '#ffca28', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: 'white', mb: 2, fontStyle: 'italic' }}>
                    "{t.comment}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: 14 }}>
                      {t.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="white" fontWeight={600}>{t.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#b3c5ff' }}>{t.city}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
            🛏️ Ready for the Best Sleep?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Use code <strong>DORMEZ10</strong> for 10% off on your first order!
          </Typography>
          <Button
            variant="contained" size="large"
            onClick={() => navigate('/products')}
            sx={{
              bgcolor: 'white', color: '#ff6f00', px: 6, py: 1.5, fontSize: 18, fontWeight: 700,
              borderRadius: 3, '&:hover': { bgcolor: '#fff8e1' }
            }}
          >
            Shop Now & Save
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
