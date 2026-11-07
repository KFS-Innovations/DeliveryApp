const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken'); // Required for seller auth

// 1. GET SELLER'S SPECIFIC PRODUCTS (Must be above wildcards if any exist later)
router.get('/seller', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Fetch Seller Products Error:", error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// 2. ADD A NEW PRODUCT (Seller only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, price, image, category, time, deliveryNote, rating, reviews } = req.body;

    const newProduct = new Product({
      sellerId: req.user.id, // Automatically ties the product to the logged-in seller
      name,
      description,
      price,
      image,
      category,
      time,
      deliveryNote,
      rating,
      reviews
    });

    await newProduct.save();
    res.json({ success: true, message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// 3. GET ALL PRODUCTS (Public route for the Buyer App Home Screen)
router.get('/', async (req, res) => {
  try {
    // Fetch products and populate the linked seller data
    const productsList = await Product.find().populate(
      'sellerId', 
      'shopName contactNumber storeLocation'
    ); 
    
    if (productsList.length === 0) {
      return res.json([
        {
          _id: '111111111111111111111111',
          name: 'Fresh Coconut (Fallback)',
          time: '25 min',
          rating: '4.9',
          reviews: '120+',
          deliveryNote: '₹0 Delivery fee',
          price: '₹40',
          image: 'https://images.unsplash.com/photo-1526653054275-4a4f37eb1d7f?w=400',
          description: 'Farm fresh coconuts harvested daily from the backwaters of Kerala.',
          category: 'Coconut',
          isFavorite: false,
          sellerId: {
            shopName: 'Kerala Farms',
            contactNumber: '+919876543210',
            storeLocation: {
              address: 'Marine Drive, Ernakulam, Kerala',
              latitude: 10.0150,
              longitude: 76.2250
            }
          }
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