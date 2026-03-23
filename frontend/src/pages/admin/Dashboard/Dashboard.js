import React, { useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Divider
} from '@mui/material';
import {
  People, Inventory, ShoppingBag, AttachMoney,
  TrendingUp, Warning
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Typography variant="h4" fontWeight={800} mt={0.5}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, width: 56, height: 56 }}>
          <Box sx={{ color }}>{icon}</Box>
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.admin);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading || !dashboard) return <Loader message="Loading dashboard..." />;

  const { stats, recentOrders, recentUsers } = dashboard;

  const statCards = [
    { title: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: <AttachMoney />, color: '#2e7d32', subtitle: 'All time' },
    { title: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag />, color: '#1565c0', subtitle: `${stats.pendingOrders} pending` },
    { title: 'Total Users', value: stats.totalUsers, icon: <People />, color: '#6a1b9a', subtitle: 'Registered' },
    { title: 'Products', value: stats.totalProducts, icon: <Inventory />, color: '#e65100', subtitle: `${stats.lowStockProducts} low stock` },
  ];

  const statusColors = {
    'Order Placed': 'info', 'Packed': 'warning', 'Shipped': 'secondary',
    'Out for Delivery': 'primary', 'Delivered': 'success', 'Cancelled': 'error',
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
        <Typography color="text.secondary">Welcome back, {useSelector(s => s.auth.user?.name)}! 👋</Typography>
      </Box>

      {stats.lowStockProducts > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography color="warning.dark" fontWeight={600}>
            ⚠️ {stats.lowStockProducts} product(s) have low stock (≤5 units)
          </Typography>
        </Box>
      )}

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Recent Orders</Typography>
              <List dense>
                {recentOrders.map((order, i) => (
                  <Box key={order._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: 14 }}>
                          {order.userId?.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={600}>{order.userId?.name}</Typography>
                            <Typography variant="body2" fontWeight={700} color="primary">
                              {formatPrice(order.totalAmount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </Typography>
                            <Chip label={order.orderStatus} size="small"
                              color={statusColors[order.orderStatus] || 'default'}
                              sx={{ height: 18, fontSize: '10px' }} />
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < recentOrders.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>New Users</Typography>
              <List dense>
                {recentUsers.map((user, i) => (
                  <Box key={user._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36, fontSize: 14 }}>
                          {user.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{user.name}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </Typography>
                    </ListItem>
                    {i < recentUsers.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
