const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const legalRoutes = require('./routes/legal');
const sellerAuthRoutes = require('./routes/SellerAuth');


// --- MOUNT ROUTES ---
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/order', require('./routes/order'));
app.use('/legal', legalRoutes);
app.use('/api/seller', sellerAuthRoutes);

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI, {
  family: 4
})
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ Database connection error:', err));

// --- SERVER HEALTH CHECK ---
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is running and talking to the frontend!' });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));