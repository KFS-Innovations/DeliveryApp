const express = require('express');
const router = express.Router();
const Products = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const productsList = await Products.find(); 
    
    if (productsList.length === 0) {
      return res.json([
        {
          _id: '111111111111111111111111',
          name: 'Fresh Coconut (Fallback)',
          shop: 'Kerala Farms',
          time: '25 min',
          rating: '4.9',
          reviews: '120+',
          deliveryNote: '₹0 Delivery fee',
          price: '₹40',
          image: 'https://images.unsplash.com/photo-1526653054275-4a4f37eb1d7f?auto=format&fit=crop&w=400&q=80',
          description: 'Farm fresh coconuts harvested daily from the backwaters of Kerala. Perfect for cooking or drinking.', // <-- Added
          sellerPhone: '+919876543210',
          category: 'Coconut',
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

module.exports = router;