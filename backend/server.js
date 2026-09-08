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

// --- MOUNT ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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