import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// User Pages
import Home from '../pages/user/Home/Home';
import Products from '../pages/user/Products/Products';
import ProductDetails from '../pages/user/ProductDetails/ProductDetails';
import Cart from '../pages/user/Cart/Cart';
import Checkout from '../pages/user/Checkout/Checkout';
import OrderHistory from '../pages/user/Orders/OrderHistory';
import OrderTracking from '../pages/user/Orders/OrderTracking';
import Profile from '../pages/user/Profile/Profile';
import Login from '../pages/user/Auth/Login';
import Register from '../pages/user/Auth/Register';
import ForgotPassword from '../pages/user/Auth/ForgotPassword';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard/Dashboard';
import ManageProducts from '../pages/admin/Products/ManageProducts';
import AddProduct from '../pages/admin/Products/AddProduct';
import EditProduct from '../pages/admin/Products/EditProduct';
import ManageOrders from '../pages/admin/Orders/ManageOrders';
import ManageUsers from '../pages/admin/Users/ManageUsers';
import ManageCoupons from '../pages/admin/Coupons/ManageCoupons';
import SalesAnalytics from '../pages/admin/Analytics/SalesAnalytics';

// Protected Route
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes - User Layout */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderTracking />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/products/add" element={<AddProduct />} />
          <Route path="/admin/products/edit/:id" element={<EditProduct />} />
          <Route path="/admin/orders" element={<ManageOrders />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/coupons" element={<ManageCoupons />} />
          <Route path="/admin/analytics" element={<SalesAnalytics />} />
        </Route>
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
