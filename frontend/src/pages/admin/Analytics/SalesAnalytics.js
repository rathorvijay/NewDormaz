import React, { useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';
import { formatPrice } from '../../../utils/formatPrice';
import {
  TrendingUp, ShoppingBag, AttachMoney, Today, CalendarMonth, DateRange
} from '@mui/icons-material';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const MetricCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" fontWeight={800} mt={0.5}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}20`, width: 48, height: 48 }}>
          <Box sx={{ color }}>{icon}</Box>
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const SalesAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector((state) => state.admin);

  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  if (loading || !analytics) return <Loader message="Loading analytics..." />;

  const { summary, charts } = analytics;

  // Daily Chart
  const dailyChartData = {
    labels: charts.dailyChart.map(d => {
      const date = new Date(d._id);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'Daily Revenue (₹)',
      data: charts.dailyChart.map(d => d.revenue),
      backgroundColor: 'rgba(26, 35, 126, 0.15)',
      borderColor: '#1a237e',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    }],
  };

  // Monthly Chart
  const monthlyChartData = {
    labels: charts.monthlyChart.map(d => {
      const [year, month] = d._id.split('-');
      return new Date(year, month - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Monthly Revenue (₹)',
      data: charts.monthlyChart.map(d => d.revenue),
      backgroundColor: '#1a237e',
      borderRadius: 6,
    }],
  };

  // Category Doughnut
  const categoryData = {
    labels: charts.categoryRevenue.map(c => c._id),
    datasets: [{
      data: charts.categoryRevenue.map(c => c.revenue),
      backgroundColor: ['#7b1fa2', '#1565c0', '#2e7d32', '#e65100', '#00695c'],
      borderWidth: 2,
      borderColor: 'white',
    }],
  };

  // Orders by status Doughnut
  const ordersStatusData = {
    labels: charts.ordersByStatus.map(o => o._id),
    datasets: [{
      data: charts.ordersByStatus.map(o => o.count),
      backgroundColor: ['#2196f3', '#ff9800', '#9c27b0', '#03a9f4', '#4caf50', '#f44336'],
      borderWidth: 2,
      borderColor: 'white',
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>📊 Sales Analytics</Typography>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={2}>
          <MetricCard title="Today" value={formatPrice(summary.todayRevenue)}
            subtitle={`${summary.todayOrders} orders`} icon={<Today />} color="#e65100" />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard title="This Week" value={formatPrice(summary.weeklyRevenue)}
            subtitle={`${summary.weeklyOrders} orders`} icon={<DateRange />} color="#1565c0" />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard title="This Month" value={formatPrice(summary.monthlyRevenue)}
            subtitle={`${summary.monthlyOrders} orders`} icon={<CalendarMonth />} color="#6a1b9a" />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard title="This Year" value={formatPrice(summary.yearlyRevenue)}
            subtitle={`${summary.yearlyOrders} orders`} icon={<TrendingUp />} color="#2e7d32" />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard title="All Time" value={formatPrice(summary.totalRevenue)}
            subtitle={`${summary.allOrders} total orders`} icon={<AttachMoney />} color="#ff6f00" />
        </Grid>
        <Grid item xs={6} md={2}>
          <MetricCard title="Total Users" value={summary.totalUsers}
            subtitle={`${summary.totalProducts} products`} icon={<ShoppingBag />} color="#0097a7" />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Daily Revenue (Last 30 Days)</Typography>
              <Line data={dailyChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Revenue by Category</Typography>
              <Doughnut data={categoryData} options={doughnutOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Monthly Revenue (Last 12 Months)</Typography>
              <Bar data={monthlyChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Orders by Status</Typography>
              <Doughnut data={ordersStatusData} options={doughnutOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products */}
      {charts.topProducts.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>🏆 Top Selling Products</Typography>
            {charts.topProducts.map((p, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: i < charts.topProducts.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: ['#ffd700', '#c0c0c0', '#cd7f32', '#1a237e', '#2e7d32'][i], width: 32, height: 32, fontSize: 14 }}>
                    {i + 1}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{p.name || 'Product'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={700} color="primary">{formatPrice(p.revenue)}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.totalSold} units sold</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SalesAnalytics;
