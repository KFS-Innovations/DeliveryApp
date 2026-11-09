const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User'); 
const calculateDistance = require('../utils/distance'); 

const verifyToken = require('../middleware/verifyToken');

// 1. Fetch Cart with Dynamic Delivery Fee
router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.productId',
      populate: { path: 'sellerId', select: 'storeLocation' }
    });
    
    const user = await User.findById(req.user.id);
    
    if (!cart || cart.items.length === 0) {
      return res.json({ items: [], subtotal: 0, deliveryFee: 0 });
    }

    let maxDistance = 0;
    let subtotal = 0;

    // --- THE FIX: GRAB LIVE LOCATION FROM FRONTEND URL ---
    const activeLat = parseFloat(req.query.lat) || (user.location && user.location.latitude);
    const activeLng = parseFloat(req.query.lng) || (user.location && user.location.longitude);

    const validItems = cart.items.filter(item => item.productId != null);

    const formattedItems = validItems.map(item => {
      const product = item.productId;
      const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
      
      subtotal += numericPrice * item.quantity;
      
      // USE activeLat AND activeLng HERE
      if (activeLat && activeLng && product.sellerId?.storeLocation?.latitude) {
        const distance = calculateDistance(
          activeLat,
          activeLng,
          product.sellerId.storeLocation.latitude,
          product.sellerId.storeLocation.longitude
        );

        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }

      return {
        productId: product._id,
        title: product.name,
        price: numericPrice,
        imageUrl: product.image,
        quantity: item.quantity
      };
    });

    const deliveryFee = Math.max(40, Math.ceil(maxDistance * 15));

    res.json({ 
      items: formattedItems, 
      subtotal: subtotal, 
      deliveryFee: deliveryFee 
    });
  } catch (error) {
    console.error("Fetch Cart Error:", error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// 2. Add to Cart (POST /api/cart/add)
router.post('/add', verifyToken, async (req, res) => {
  const { productId, quantity, userLat, userLng } = req.body;

  try {
    const product = await Product.findById(productId).populate('sellerId', 'storeLocation');
    
    if (!userLat || !userLng) {
      return res.status(400).json({ error: 'Please set your delivery location first.' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.sellerId?.storeLocation?.latitude) {
      const distance = calculateDistance(
        parseFloat(userLat),
        parseFloat(userLng),
        parseFloat(product.sellerId.storeLocation.latitude),
        parseFloat(product.sellerId.storeLocation.longitude)
      );
      // Block if distance is greater than 15 km
      if (distance > 15) {
        return res.status(400).json({ 
          error: `Delivery unavailable. This shop is too far away to deliver fresh items to your current location.` 
        });
      }
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    await cart.save();
    res.status(200).json({ message: 'Item added to cart successfully', cart });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// 3. Update Item Quantity (PUT /api/cart/update)
router.put('/update', verifyToken, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id, "items.productId": productId },
      { $set: { "items.$.quantity": quantity } },
      { returnDocument: 'after' }
    );

    if (!cart) {
      return res.status(404).json({ error: 'Cart or item not found' });
    }

    res.json({ message: 'Quantity updated', cart });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// 4. Remove Item from Cart (DELETE /api/cart/remove/:productId)
router.delete('/remove/:productId', verifyToken, async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { items: { productId: productId } } },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error("Remove Item Error:", error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

module.exports = router;