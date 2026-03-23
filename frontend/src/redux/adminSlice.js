import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const fetchAllOrders = createAsyncThunk('admin/fetchOrders', async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await axiosInstance.get(`/orders?${query}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchAllUsers = createAsyncThunk('admin/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await axiosInstance.get(`/users?${query}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateOrderStatus = createAsyncThunk('admin/updateOrderStatus', async ({ id, orderStatus }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/orders/${id}/status`, { orderStatus });
    toast.success('Order status updated');
    return res.data.order;
  } catch (err) {
    toast.error(err.response?.data?.message);
    return rejectWithValue(err.response?.data?.message);
  }
});

export const toggleBlockUser = createAsyncThunk('admin/toggleBlock', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/users/${id}/block`);
    toast.success(res.data.message);
    return { id, isBlocked: res.data.isBlocked };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchDashboard = createAsyncThunk('admin/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/dashboard');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchAnalytics = createAsyncThunk('admin/analytics', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/analytics');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchAllCoupons = createAsyncThunk('admin/coupons', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/coupons');
    return res.data.coupons;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createCoupon = createAsyncThunk('admin/createCoupon', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/coupons', data);
    toast.success('Coupon created successfully');
    return res.data.coupon;
  } catch (err) {
    toast.error(err.response?.data?.message);
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteCoupon = createAsyncThunk('admin/deleteCoupon', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/coupons/${id}`);
    toast.success('Coupon deleted');
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    orders: [],
    users: [],
    coupons: [],
    dashboard: null,
    analytics: null,
    total: 0,
    pages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.orders = state.orders.map(o => o._id === action.payload._id ? action.payload : o);
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        state.users = state.users.map(u => u._id === action.payload.id ? { ...u, isBlocked: action.payload.isBlocked } : u);
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.dashboard = action.payload; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(fetchAllCoupons.fulfilled, (state, action) => { state.coupons = action.payload; })
      .addCase(createCoupon.fulfilled, (state, action) => { state.coupons.unshift(action.payload); })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
      });
  },
});

export default adminSlice.reducer;
