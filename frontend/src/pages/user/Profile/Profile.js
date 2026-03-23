import React, { useState } from 'react';
import {
  Box, Container, Grid, Card, CardContent, Typography, TextField,
  Button, Avatar, Divider, Alert, CircularProgress
} from '@mui/material';
import { Person, Lock, LocationOn, Save } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../../redux/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileSave = async () => {
    setSuccess(''); setError('');
    const result = await dispatch(updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      address: {
        street: profileForm.street,
        city: profileForm.city,
        state: profileForm.state,
        pincode: profileForm.pincode,
      },
    }));
    if (result.meta.requestStatus === 'fulfilled') setSuccess('Profile updated successfully!');
    else setError(result.payload || 'Update failed');
  };

  return (
    <Box sx={{ py: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight={800} gutterBottom>👤 My Profile</Typography>

        {/* Avatar Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>{user?.name}</Typography>
              <Typography color="text.secondary">{user?.email}</Typography>
              <Typography variant="caption" sx={{
                bgcolor: user?.role === 'admin' ? '#ff6f00' : 'primary.main',
                color: 'white', px: 1.5, py: 0.3, borderRadius: 1, mt: 0.5, display: 'inline-block',
              }}>
                {user?.role?.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Person color="primary" />
                  <Typography variant="h6" fontWeight={700}>Personal Information</Typography>
                </Box>
                <TextField fullWidth label="Full Name" value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  sx={{ mb: 2 }} />
                <TextField fullWidth label="Email" value={user?.email} disabled sx={{ mb: 2 }} />
                <TextField fullWidth label="Phone Number" value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </CardContent>
            </Card>
          </Grid>

          {/* Address */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" fontWeight={700}>Default Address</Typography>
                </Box>
                <TextField fullWidth label="Street" value={profileForm.street}
                  onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                  sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="City" value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="State" value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Pincode" value={profileForm.pincode}
                      onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Button
          variant="contained" size="large" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleProfileSave} disabled={loading}
          sx={{ mt: 3, px: 4, borderRadius: 2 }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Container>
    </Box>
  );
};

export default Profile;
