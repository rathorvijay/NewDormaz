import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Bedtime, Lock, Visibility, VisibilityOff, ArrowBack, CheckCircle } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordError = useMemo(() => {
    if (!form.password) return '';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }, [form.password]);

  const confirmError = useMemo(() => {
    if (!form.confirmPassword) return '';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  }, [form.password, form.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }

    if (passwordError || confirmError) {
      setError(passwordError || confirmError);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put(`/auth/reset-password/${token}`, { password: form.password });
      setSuccess(true);
      toast.success('Password reset successful');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid or expired reset link';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Bedtime sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary">Reset Password</Typography>
          <Typography color="text.secondary">Create a new password for your Dormez account</Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 4 }}>
            {success ? (
              <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
                Your password has been updated successfully. Redirecting to login...
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                  fullWidth
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  error={Boolean(passwordError)}
                  helperText={passwordError || 'Use at least 6 characters'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  error={Boolean(confirmError)}
                  helperText={confirmError || 'Re-enter your new password'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  required
                />

                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 2 }}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                </Button>
              </form>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link component={RouterLink} to="/login" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowBack fontSize="small" /> Back to Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;
