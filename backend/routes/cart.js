const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Middleware to verify JWT and attach user info to req.user
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.json({ items: [] });
    }

    // Format the response for the frontend UI
    const formattedItems = cart.items.map(item => ({
      productId: item.productId._id,
      title: item.productId.name,
      price: parseFloat(item.productId.price.replace(/[^0-9.]/g, '')),
      imageUrl: item.productId.image,
      quantity: item.quantity
    }));

    res.json({ items: formattedItems });
  } catch (error) {
    console.error("Fetch Cart Error:", error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// 2. Add to Cart (POST /api/cart/add)
router.post('/add', verifyToken, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      // Create a new cart if one doesn't exist for the user
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if the item already exists in the cart array
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // If it exists, increment the quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // If not, push the new item using MongoDB array operations
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
    // Utilize MongoDB's array filters to update the specific item's quantity directly
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
    // Utilize MongoDB's $pull operator to safely remove the object from the array
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