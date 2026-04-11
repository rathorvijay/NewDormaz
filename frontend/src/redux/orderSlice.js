import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const createOrder = createAsyncThunk('orders/create', async (orderData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/orders', orderData);
    toast.success('Order placed successfully! 🎉');
    return res.data.order;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Order failed');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/orders/my');
    return res.data.orders;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/orders/${id}`);
    return res.data.order;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const cancelOrder = createAsyncThunk('orders/cancel', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/orders/${id}/cancel`);
    toast.success('Order cancelled successfully');
    return res.data.order;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Cancellation failed');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createReturnRequest = createAsyncThunk('orders/createReturn', async ({ orderId, formData }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`/orders/${orderId}/returns`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    toast.success('Return request submitted successfully');
    return res.data.returnRequest;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Return request failed');
    return rejectWithValue(err.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    selectedOrder: null,
    loading: false,
    returnSubmitting: false,
    error: null,
  },
  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) => (o._id === action.payload._id ? action.payload : o));
        state.selectedOrder = action.payload;
      })
      .addCase(createReturnRequest.pending, (state) => {
        state.returnSubmitting = true;
      })
      .addCase(createReturnRequest.fulfilled, (state) => {
        state.returnSubmitting = false;
      })
      .addCase(createReturnRequest.rejected, (state, action) => {
        state.returnSubmitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
