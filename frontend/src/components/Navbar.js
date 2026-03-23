import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Button, Drawer,
  List, ListItem, ListItemText, useTheme, useMediaQuery, Avatar, Menu, MenuItem, Divider
} from '@mui/material';
import {
  ShoppingCart, Menu as MenuIcon, Bedtime, AccountCircle, 
  Dashboard, Logout, Person, History
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const cartCount = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
  ];

  const mobileDrawer = (
    <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      <Box sx={{ width: 260, pt: 2 }}>
        <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bedtime sx={{ color: 'primary.main', fontSize: 30 }} />
          <Typography variant="h6" color="primary" fontWeight={700}>Dormez</Typography>
        </Box>
        <Divider />
        <List>
          {navLinks.map((link) => (
            <ListItem button key={link.label} onClick={() => { navigate(link.path); setDrawerOpen(false); }}>
              <ListItemText primary={link.label} />
            </ListItem>
          ))}
          {user ? (
            <>
              <ListItem button onClick={() => { navigate('/profile'); setDrawerOpen(false); }}>
                <ListItemText primary="Profile" />
              </ListItem>
              <ListItem button onClick={() => { navigate('/orders'); setDrawerOpen(false); }}>
                <ListItemText primary="My Orders" />
              </ListItem>
              {user.role === 'admin' && (
                <ListItem button onClick={() => { navigate('/admin/dashboard'); setDrawerOpen(false); }}>
                  <ListItemText primary="Admin Panel" />
                </ListItem>
              )}
              <ListItem button onClick={() => { dispatch(logout()); setDrawerOpen(false); navigate('/'); }}>
                <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => { navigate('/login'); setDrawerOpen(false); }}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => { navigate('/register'); setDrawerOpen(false); }}>
                <ListItemText primary="Register" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" elevation={2} sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Bedtime sx={{ fontSize: 32, color: '#ffca28' }} />
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>
                DORMEZ
              </Typography>
              <Typography variant="caption" sx={{ color: '#b3c5ff', fontSize: '9px', letterSpacing: 2 }}>
                MATTRESS INDUSTRY
              </Typography>
            </Box>
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navLinks.map((link) => (
                <Button key={link.label} color="inherit" component={Link} to={link.path}
                  sx={{ fontWeight: 500, '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Cart */}
            {user && (
              <IconButton color="inherit" onClick={() => navigate('/cart')}>
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            )}

            {/* User Menu */}
            {user ? (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 16 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                      {user.name} ({user.role})
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                    <Person fontSize="small" sx={{ mr: 1 }} /> Profile
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/orders'); handleMenuClose(); }}>
                    <History fontSize="small" sx={{ mr: 1 }} /> My Orders
                  </MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem onClick={() => { navigate('/admin/dashboard'); handleMenuClose(); }}>
                      <Dashboard fontSize="small" sx={{ mr: 1 }} /> Admin Panel
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              !isMobile && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="inherit" size="small" component={Link} to="/login"
                    sx={{ borderColor: 'rgba(255,255,255,0.5)' }}>
                    Login
                  </Button>
                  <Button variant="contained" color="secondary" size="small" component={Link} to="/register">
                    Register
                  </Button>
                </Box>
              )
            )}

            {isMobile && (
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {mobileDrawer}
    </>
  );
};

export default Navbar;
