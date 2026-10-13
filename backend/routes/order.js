// routes/order.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/verifyToken');

router.post('/place', verifyToken, async (req, res) => {
    try {
        const { paymentMethod, deliveryAddress, totalAmount } = req.body;
        const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        const orderItems = cart.items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: parseFloat(item.productId.price.replace(/[^0-9.]/g, ''))
        }));

        // 3. Create and save the new Order
        const newOrder = new Order({
            userId: req.user.id,
            items: orderItems,
            totalAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid'
        });

        await newOrder.save();

        // 4. Empty the user's cart now that the order is placed
        cart.items = [];
        await cart.save();

        res.json({ success: true, message: 'Order placed successfully!', orderId: newOrder._id });

    } catch (error) {
        console.error("Place Order Error:", error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

module.exports = router;