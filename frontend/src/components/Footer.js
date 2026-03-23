import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Link, Divider } from '@mui/material';
import { Facebook, Instagram, Twitter, YouTube, Bedtime, Phone, Email, LocationOn } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const Footer = () => {
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #0d1b5e 0%, #1a237e 100%)', color: 'white', mt: 'auto' }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Bedtime sx={{ color: '#ffca28', fontSize: 36 }} />
              <Box>
                <Typography variant="h5" fontWeight={800}>DORMEZ</Typography>
                <Typography variant="caption" sx={{ color: '#b3c5ff', letterSpacing: 2 }}>MATTRESS INDUSTRY</Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: '#b3c5ff', lineHeight: 1.8, mb: 2 }}>
              Experience the best sleep of your life with our premium mattress collection. 
              Crafted with love for your perfect rest. 🛏️
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[Facebook, Instagram, Twitter, YouTube].map((Icon, i) => (
                <IconButton key={i} size="small" sx={{ color: '#b3c5ff', '&:hover': { color: '#ffca28' } }}>
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#ffca28' }}>Quick Links</Typography>
            {['Home', 'Products', 'Cart', 'Orders', 'Profile'].map((link) => (
              <Link
                key={link}
                href={`/${link.toLowerCase()}`}
                underline="hover"
                sx={{ display: 'block', color: '#b3c5ff', mb: 1, fontSize: '14px', '&:hover': { color: 'white' } }}
              >
                {link}
              </Link>
            ))}
          </Grid>

          {/* Categories */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#ffca28' }}>Categories</Typography>
            {['Luxury', 'Ortho', 'Premium', 'Memory', 'Spring'].map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                underline="hover"
                sx={{ display: 'block', color: '#b3c5ff', mb: 1, fontSize: '14px', '&:hover': { color: 'white' } }}
              >
                {cat} Mattress
              </Link>
            ))}
          </Grid>

          {/* Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ color: '#ffca28' }}>Contact Us</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
              <LocationOn sx={{ color: '#ffca28', fontSize: 20, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: '#b3c5ff' }}>
                Dormez Mattress Industry,<br />India
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Phone sx={{ color: '#ffca28', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#b3c5ff' }}>+91 88177 09195</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Email sx={{ color: '#ffca28', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#b3c5ff' }}>support@dormezmattress.com</Typography>
            </Box>
            <Box
              component="a"
              href="https://wa.me/918817709195"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                background: '#25D366', color: 'white', px: 2, py: 1,
                borderRadius: 2, textDecoration: 'none', width: 'fit-content',
                '&:hover': { background: '#128C7E' },
              }}
            >
              <WhatsAppIcon fontSize="small" />
              <Typography variant="body2" fontWeight={600}>Chat on WhatsApp</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 4 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#b3c5ff' }}>
            © {new Date().getFullYear()} Dormez Mattress Industry. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3c5ff' }}>
            Made with ❤️ for better sleep
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
