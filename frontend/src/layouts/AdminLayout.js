import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon,
  ListItemText, IconButton, Avatar, Divider, Badge, useTheme, useMediaQuery, Tooltip
} from '@mui/material';
import {
  Dashboard, Inventory, ShoppingBag, People, LocalOffer, BarChart,
  Menu, Bedtime, Logout, ChevronLeft, Notifications
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
  { text: 'Products', icon: <Inventory />, path: '/admin/products' },
  { text: 'Orders', icon: <ShoppingBag />, path: '/admin/orders' },
  { text: 'Users', icon: <People />, path: '/admin/users' },
  { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
  { text: 'Analytics', icon: <BarChart />, path: '/admin/analytics' },
];

const AdminLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const open = isMobile ? false : drawerOpen;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #1a237e 0%, #0d1b5e 100%)' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Bedtime sx={{ color: '#ffca28', fontSize: 30 }} />
        <Box>
          <Typography variant="h6" fontWeight={800} color="white">DORMEZ</Typography>
          <Typography variant="caption" sx={{ color: '#b3c5ff', fontSize: '9px', letterSpacing: 1 }}>ADMIN PANEL</Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto', color: 'white' }} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1, mb: 0.5, borderRadius: 2,
                background: isActive ? 'rgba(255,202,40,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #ffca28' : '3px solid transparent',
                '&:hover': { background: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? '#ffca28' : '#b3c5ff', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ color: isActive ? '#ffca28' : 'white', fontWeight: isActive ? 700 : 400, fontSize: 14 }}
              />
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ bgcolor: '#ffca28', color: '#1a237e', width: 36, height: 36, fontSize: 14 }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" color="white" fontWeight={600}>{user?.name}</Typography>
            <Typography variant="caption" sx={{ color: '#b3c5ff' }}>Administrator</Typography>
          </Box>
        </Box>
        <ListItem button onClick={() => { dispatch(logout()); navigate('/'); }}
          sx={{ borderRadius: 2, '&:hover': { background: 'rgba(255,0,0,0.1)' } }}>
          <ListItemIcon sx={{ color: '#ff5252', minWidth: 36 }}><Logout fontSize="small" /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ color: '#ff5252', fontSize: 14 }} />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isMobile ? drawerOpen : open}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {/* Top AppBar */}
        <AppBar position="sticky" color="inherit" elevation={1} sx={{ zIndex: 1 }}>
          <Toolbar>
            {(!open || isMobile) && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
                <Menu />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: 'primary.main' }}>
              {menuItems.find(m => m.path === location.pathname)?.text || 'Admin'}
            </Typography>
            <Tooltip title="View Store">
              <IconButton onClick={() => navigate('/')}>
                <Bedtime color="primary" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
