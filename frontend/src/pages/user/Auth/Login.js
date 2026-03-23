import React, { useState } from 'react';
import {
  Box, Container, Card, CardContent, TextField, Button, Typography,
  Link, InputAdornment, IconButton, Divider, CircularProgress
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Bedtime } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginUser } from '../../../redux/authSlice';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (result.meta.requestStatus === 'fulfilled') {
      const user = result.payload.user;
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Bedtime sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary">Welcome Back!</Typography>
          <Typography color="text.secondary">Sign in to your Dormez account</Typography>
        </Box>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email Address" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                sx={{ mb: 2 }} required
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }} required
              />
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary">
                  Forgot Password?
                </Link>
              </Box>
              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading} sx={{ py: 1.5, fontSize: 16, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>
            <Divider sx={{ my: 3 }}>OR</Divider>
            <Typography textAlign="center" variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" color="primary" fontWeight={600}>
                Register Now
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
