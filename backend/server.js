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

// 2. Define the Restaurant Schema (Blueprint for MongoDB)
const RestaurantSchema = new mongoose.Schema({
  name: String,
  tags: String,
  rating: String,
  reviews: String,
  delivery: String,
  promos: [String],
  image: String
});

// Create the model and explicitly link it to the 'Restaurants' collection
const Restaurant = mongoose.model('Restaurant', RestaurantSchema, 'Restaurants');

// 3. The API Route your frontend is looking for!
app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find(); 
    
    // If the database is empty, let's send a fallback so the app doesn't show an error
    if (restaurants.length === 0) {
      return res.json([
        {
          _id: 'fallback1',
          name: 'KFC Banani 11 (Fallback)',
          tags: '15-20 min • $$$ • Fried',
          rating: '5.0',
          reviews: '(32)',
          delivery: 'Free',
          promos: ['40% off $10 Hot offer'],
          image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=800&q=80'
        }
      ]);
    }
    res.json(restaurants);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Example API Route (Status check)
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is running and talking to the frontend!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));