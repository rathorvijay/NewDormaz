import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const extractErrorPayload = (err, fallbackMessage) => {
  if (err.response?.data) {
    return {
      message: err.response.data.message || fallbackMessage,
      requiresVerification: err.response.data.requiresVerification || false,
      email: err.response.data.email || '',
    };
  }

  return { message: fallbackMessage, requiresVerification: false, email: '' };
};

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'Registration failed'));
  }
});

export const verifyEmailOtp = createAsyncThunk('auth/verifyEmailOtp', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/verify-email-otp', data);
    localStorage.setItem('dormezToken', res.data.token);
    localStorage.setItem('dormezUser', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'OTP verification failed'));
  }
});

export const resendEmailOtp = createAsyncThunk('auth/resendEmailOtp', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/resend-email-otp', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'Failed to resend OTP'));
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/auth/login', data);
    localStorage.setItem('dormezToken', res.data.token);
    localStorage.setItem('dormezUser', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'Login failed'));
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'Failed to get user'));
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put('/users/profile', data);
    localStorage.setItem('dormezUser', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(extractErrorPayload(err, 'Update failed'));
  }
});

const initialUser = localStorage.getItem('dormezUser') ? JSON.parse(localStorage.getItem('dormezUser')) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: localStorage.getItem('dormezToken') || null,
    pendingVerification: null,
    loading: false,
    verifyingOtp: false,
    resendLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.pendingVerification = null;
      localStorage.removeItem('dormezToken');
      localStorage.removeItem('dormezUser');
      toast.success('Logged out successfully');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPendingVerification: (state) => {
      state.pendingVerification = null;
    },
    setPendingVerification: (state, action) => {
      state.pendingVerification = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingVerification = {
          email: action.payload.email,
          expiresAt: action.payload.otp?.expiresAt,
          resendAvailableAt: action.payload.otp?.resendAvailableAt,
        };
        toast.success('OTP sent to your email. Please verify to activate your account.');
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        toast.error(state.error);
      })
      .addCase(verifyEmailOtp.pending, (state) => {
        state.verifyingOtp = true;
        state.error = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.verifyingOtp = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.pendingVerification = null;
        toast.success('Email verified successfully! Welcome to Dormez 🎉');
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.verifyingOtp = false;
        state.error = action.payload?.message || 'OTP verification failed';
        toast.error(state.error);
      })
      .addCase(resendEmailOtp.pending, (state) => {
        state.resendLoading = true;
      })
      .addCase(resendEmailOtp.fulfilled, (state, action) => {
        state.resendLoading = false;
        state.pendingVerification = {
          email: action.payload.email,
          expiresAt: action.payload.otp?.expiresAt,
          resendAvailableAt: action.payload.otp?.resendAvailableAt,
        };
        toast.success('A fresh OTP has been sent to your email.');
      })
      .addCase(resendEmailOtp.rejected, (state, action) => {
        state.resendLoading = false;
        state.error = action.payload?.message || 'Failed to resend OTP';
        toast.error(state.error);
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        toast.success(`Welcome back, ${action.payload.user.name}! 🛏️`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        if (!action.payload?.requiresVerification) {
          toast.error(state.error);
        }
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        toast.success('Profile updated successfully');
      });
  },
});

export const { logout, clearError, clearPendingVerification, setPendingVerification } = authSlice.actions;
export default authSlice.reducer;
