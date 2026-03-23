import React, { useState } from 'react';
import {
  Box, Container, Card, CardContent, TextField, Button, Typography,
  Link, InputAdornment, IconButton, Divider, CircularProgress
} from '@mui/material';
import { Email, Lock, Person, Visibility, VisibilityOff, Bedtime } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../redux/authSlice';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
    if (result.meta.requestStatus === 'fulfilled') navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eaf6 0%, #fce4ec 100%)', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Bedtime sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary">Create Account</Typography>
          <Typography color="text.secondary">Join Dormez for the best sleep experience 🛏️</Typography>
        </Box>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Full Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={!!errors.name} helperText={errors.name}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                sx={{ mb: 2 }} required
              />
              <TextField
                fullWidth label="Email Address" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={!!errors.email} helperText={errors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                sx={{ mb: 2 }} required
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!errors.password} helperText={errors.password}
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
                sx={{ mb: 2 }} required
              />
              <TextField
                fullWidth label="Confirm Password" type="password" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
                sx={{ mb: 3 }} required
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: 16, borderRadius: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </form>
            <Divider sx={{ my: 3 }}>OR</Divider>
            <Typography textAlign="center" variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary" fontWeight={600}>Sign In</Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
