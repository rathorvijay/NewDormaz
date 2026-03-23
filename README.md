# 🛏️ Dormez Mattress Industry - Complete E-Commerce Platform

A full-stack e-commerce platform for premium mattresses, built with **Node.js + Express + MongoDB** (Backend) and **React + Material UI** (Frontend).

---

## 🏗️ Project Structure

```
dormez-mattress-industry/
├── backend/          # Node.js + Express + MongoDB
├── frontend/         # React + Material UI
├── docs/             # Documentation
└── README.md
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based Login / Register / Forgot Password |
| 🛒 Shopping Cart | Add, Update, Remove items with real-time sync |
| 💳 Razorpay Payment | Full payment gateway integration |
| 💰 COD | Cash on Delivery option |
| 🎟️ Coupon System | DORMEZ10, percentage & fixed coupons |
| ⭐ Reviews & Ratings | Verified purchase reviews with star ratings |
| 📦 Order Tracking | 5-step delivery tracking with email updates |
| 📧 Email Notifications | Order confirmation + status update emails |
| 📊 Sales Analytics | Daily/Weekly/Monthly revenue charts |
| 📷 Cloudinary | Image upload & management |
| 🔍 Search & Filter | By category, size, price, sort options |
| 📱 WhatsApp Button | Floating chat support button |
| 👤 Role-Based Access | Admin & User separate routes |
| 🚨 Low Stock Alerts | Admin inventory management |
| 🔒 Rate Limiting | API security with express-rate-limit |
| 🪵 Winston Logger | Structured logging |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account
- Gmail (for email)

---

### Backend Setup

```bash
cd backend
npm install
cp .env .env.local
# Edit .env with your credentials
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env .env.local
# Edit .env with your credentials
npm start
```

**Frontend runs on:** `http://localhost:3000`

---

## ⚙️ Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/dormez_mattress
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Dormez Mattress <your_email@gmail.com>

FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY=your_razorpay_key_id
REACT_APP_WHATSAPP_NUMBER=918817709195
```

---

## 📱 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |
| POST | `/api/auth/forgot-password` | Public |
| PUT | `/api/auth/reset-password/:token` | Public |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/featured` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | Admin |
| PUT | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Private |
| GET | `/api/orders/my` | Private |
| GET | `/api/orders/:id` | Private |
| GET | `/api/orders` | Admin |
| PUT | `/api/orders/:id/status` | Admin |
| PUT | `/api/orders/:id/cancel` | Private |

### Payment
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/payment/create-order` | Private |
| POST | `/api/payment/verify` | Private |

### Coupons
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/coupons/apply` | Private |
| GET | `/api/coupons` | Admin |
| POST | `/api/coupons` | Admin |
| PUT | `/api/coupons/:id/toggle` | Admin |
| DELETE | `/api/coupons/:id` | Admin |

---

## 🎨 Tech Stack

**Frontend:**
- React 18
- Material UI v5
- Redux Toolkit
- React Router v6
- Chart.js + React-Chartjs-2
- Axios
- React Hot Toast

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (Images)
- Razorpay (Payments)
- Nodemailer (Emails)
- Winston (Logging)
- Helmet + Rate Limiting (Security)

---

## 🛏️ Product Categories

| Category | Description |
|----------|-------------|
| 👑 Luxury | Premium comfort & style |
| 🏥 Ortho | Medical grade support |
| ⭐ Premium | Best value for money |
| 🧠 Memory | Body-conforming foam |
| 🌀 Spring | Traditional bounce |

---

## 🔐 Default Roles

Create admin by running in MongoDB:
```js
db.users.updateOne({ email: "admin@dormez.com" }, { $set: { role: "admin" } })
```

---

## 📞 WhatsApp Support

Floating WhatsApp button configured for: **+91 88177 09195**

Link: `https://wa.me/918817709195`

---

## 🌙 Made with ❤️ by Dormez Team

> *Sleep Better, Live Better*
