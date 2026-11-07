const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller');

// POST: /api/seller/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if seller exists
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // 2. Compare the password
    let isMatch = false;
    
    // If the password in DB doesn't start with '$' (bcrypt prefix), it's plain text
    if (!seller.password.startsWith('$')) {
        isMatch = (password === seller.password); 
    } else {
        isMatch = await bcrypt.compare(password, seller.password);
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: seller._id, role: seller.role }, 
      process.env.JWT_SECRET || 'your_secret_key', 
      { expiresIn: '7d' }
    );

    // 4. Send token and shop info back to frontend
    res.json({ 
      success: true,
      token, 
      shopName: seller.shopName,
      sellerId: seller._id
    });

  } catch (error) {
    console.error("Seller Login Error:", error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;