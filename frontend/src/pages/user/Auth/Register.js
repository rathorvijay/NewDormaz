import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Link,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  Bedtime,
  Email,
  Lock,
  Person,
  Replay,
  Security,
  Visibility,
  VisibilityOff,
  VerifiedUser,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  clearPendingVerification,
  registerUser,
  resendEmailOtp,
  setPendingVerification,
  verifyEmailOtp,
} from '../../../redux/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, verifyingOtp, resendLoading, pendingVerification, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (location.state?.email) {
      setForm((prev) => ({ ...prev, email: location.state.email }));
      dispatch(
        setPendingVerification({
          email: location.state.email,
          expiresAt: null,
          resendAvailableAt: location.state.resendAvailableAt || new Date().toISOString(),
        })
      );
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (!pendingVerification?.resendAvailableAt) {
      setCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(pendingVerification.resendAvailableAt).getTime() - Date.now()) / 1000)
      );
      setCooldownSeconds(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [pendingVerification]);

  useEffect(() => {
    return () => {
      if (!location.state?.email) {
        dispatch(clearPendingVerification());
      }
    };
  }, [dispatch, location.state]);

  const isOtpStep = Boolean(pendingVerification?.email);

  const otpExpiryText = useMemo(() => {
    if (!pendingVerification?.expiresAt) return 'OTP expires automatically after 5 minutes.';
    return `OTP valid until ${new Date(pendingVerification.expiresAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}.`;
  }, [pendingVerification]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const result = await dispatch(verifyEmailOtp({ email: pendingVerification.email, otp }));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/');
    }
  };

  const handleResendOtp = async () => {
    if (!pendingVerification?.email) return;
    await dispatch(resendEmailOtp({ email: pendingVerification.email }));
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8eaf6 0%, #fce4ec 100%)', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Bedtime sx={{ fontSize: 60, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={800} color="primary">
            {isOtpStep ? 'Verify Your Email' : 'Create Account'}
          </Typography>
          <Typography color="text.secondary">
            {isOtpStep ? 'Register → Generate OTP → Send Email → Verify → Activate Account' : 'Join Dormez for the best sleep experience 🛏️'}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 4 }}>
                {!isOtpStep ? (
                  <form onSubmit={handleRegister}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      error={!!errors.password}
                      helperText={errors.password}
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
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
                      sx={{ mb: 3 }}
                      required
                    />
                    <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: 16, borderRadius: 2 }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account & Send OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      We sent a 6-digit OTP to <strong>{pendingVerification.email}</strong>. {otpExpiryText}
                    </Alert>
                    {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                      fullWidth
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                      placeholder="123456"
                      InputProps={{ startAdornment: <InputAdornment position="start"><VerifiedUser color="action" /></InputAdornment> }}
                      sx={{ mb: 2 }}
                      required
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" />
                        Attempts are limited and OTP expires automatically.
                      </Typography>
                      <Button
                        variant="text"
                        startIcon={<Replay />}
                        onClick={handleResendOtp}
                        disabled={cooldownSeconds > 0 || resendLoading}
                      >
                        {resendLoading ? 'Sending...' : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend OTP'}
                      </Button>
                    </Box>
                    <Button type="submit" variant="contained" fullWidth size="large" disabled={verifyingOtp || otp.length !== 6} sx={{ py: 1.5, fontSize: 16, borderRadius: 2 }}>
                      {verifyingOtp ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP & Activate Account'}
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      fullWidth
                      sx={{ mt: 1 }}
                      onClick={() => {
                        dispatch(clearPendingVerification());
                        setOtp('');
                      }}
                    >
                      Edit registration details
                    </Button>
                  </form>
                )}

                <Divider sx={{ my: 3 }}>OR</Divider>
                <Typography textAlign="center" variant="body2">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" color="primary" fontWeight={600}>Sign In</Link>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} /> Secure OTP Rules
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                  <Alert severity="success">OTP is valid for only 5 minutes.</Alert>
                  <Alert severity="info">Resend OTP is protected with cooldown to prevent spam.</Alert>
                  <Alert severity="warning">Repeated wrong attempts temporarily block verification.</Alert>
                  <Alert severity="info">Dormez stores OTP securely in hashed form, not plain text.</Alert>
                </Box>
                <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: '#f8f9ff' }}>
                  <Typography fontWeight={700} gutterBottom>How it works</Typography>
                  <Typography variant="body2" color="text.secondary">1. Register with your details</Typography>
                  <Typography variant="body2" color="text.secondary">2. Receive OTP on email</Typography>
                  <Typography variant="body2" color="text.secondary">3. Enter OTP within 5 minutes</Typography>
                  <Typography variant="body2" color="text.secondary">4. Account gets activated instantly</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Register;
