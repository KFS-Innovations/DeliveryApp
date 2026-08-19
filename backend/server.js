const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB Atlas (with the IPv4 fix)
mongoose.connect(process.env.MONGODB_URI, {
  family: 4
})
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('❌ Database connection error:', err));

// 2. Define the Products Schema (Updated to match your new UI)
const ProductsSchema = new mongoose.Schema({
  name: String,
  shop: String,
  time: String,
  rating: String,
  reviews: String,
  deliveryNote: String,
  price: String,
  image: String,
  isFavorite: { type: Boolean, default: false }
});

// Create the model (We are linking it to your existing 'Restaurants' collection in Atlas)
const Products = mongoose.model('Products', ProductsSchema, 'products');

// 3. The API Route your frontend is looking for!
app.get('/api/products', async (req, res) => {
  try {
    // FIX: Using the 'Products' model we defined above
    const productsList = await Products.find(); 
    
    // If the database is empty, let's send a fallback so the app doesn't show an error
    if (productsList.length === 0) {
      return res.json([
        {
          _id: 'fallback1',
          name: 'Fresh Coconut (Fallback)',
          shop: 'Kerala Farms',
          time: '25 min',
          rating: '4.9',
          reviews: '120+',
          deliveryNote: '$0 Delivery fee',
          price: '$4.99',
          image: 'https://images.unsplash.com/photo-1526653054275-4a4f37eb1d7f?auto=format&fit=crop&w=400&q=80',
          isFavorite: false
        }
      ]);
    }
    
    res.json(productsList);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Example API Route (Status check)
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is running and talking to the frontend!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));