import React, { useState } from 'react';
import { Box, Container, Card, CardContent, TextField, Button, Typography, Link, InputAdornment, Alert } from '@mui/material';
import { Email, Bedtime, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Bedtime sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary">Forgot Password?</Typography>
          <Typography color="text.secondary">Enter your email to receive a reset link</Typography>
        </Box>
        <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 4 }}>
            {sent ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Password reset email sent to <strong>{email}</strong>. Please check your inbox.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth label="Email Address" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                  sx={{ mb: 3 }} required
                />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 2 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link component={RouterLink} to="/login" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <ArrowBack fontSize="small" /> Back to Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
