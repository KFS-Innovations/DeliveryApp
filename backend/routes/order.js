const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // Using plural Products matching your schema
const verifyToken = require('../middleware/verifyToken');

// 1. PLACE NEW ORDER
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

        const newOrder = new Order({
            userId: req.user.id,
            items: orderItems,
            totalAmount: totalAmount,
            deliveryAddress: deliveryAddress,
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid'
        });

        await newOrder.save();

        cart.items = [];
        await cart.save();

        res.json({ success: true, message: 'Order placed successfully!', orderId: newOrder._id });

    } catch (error) {
        console.error("Place Order Error:", error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// 2. GET ORDER HISTORY (MUST BE ABOVE /:id)
router.get('/history', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .populate({
                path: 'items.productId',
                select: 'name image price sellerId', 
                populate: {
                    path: 'sellerId',
                    select: 'shopName' // Deep populate shop name for history list
                }
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
});

// --- NEW SELLER ROUTE ---
// 2.5 GET ORDERS SPECIFIC TO THE LOGGED-IN SELLER (MUST BE ABOVE /:id)
router.get('/seller', verifyToken, async (req, res) => {
    try {
        // Step A: Find all products that belong to this seller's ID
        const sellerProducts = await Product.find({ sellerId: req.user.id }).select('_id');
        const sellerProductIds = sellerProducts.map(product => product._id);

        if (sellerProductIds.length === 0) {
            return res.json({ success: true, orders: [] }); 
        }

        // Step B: Find all orders containing this seller's products AND populate the User
        const orders = await Order.find({ 'items.productId': { $in: sellerProductIds } })
            .populate('userId', 'name phone') // <-- ADD THIS LINE to fetch the buyer's name and phone
            .populate({
                path: 'items.productId',
                select: 'name image price sellerId',
            })
            .sort({ createdAt: -1 });

        // Step C: Filter the order items array so the seller only sees their own products 
        const sellerSpecificOrders = orders.map(order => {
            const orderObj = order.toObject();
            
            orderObj.items = orderObj.items.filter(item => 
                item.productId && item.productId.sellerId.toString() === req.user.id
            );
            
            return orderObj;
        });

        res.json({ success: true, orders: sellerSpecificOrders });
    } catch (error) {
        console.error("Fetch Seller Orders Error:", error);
        res.status(500).json({ error: 'Failed to fetch seller orders' });
    }
});

// 3. GET SINGLE ORDER STATUS
router.get('/:id', verifyToken, async (req, res) => {
    try {
        // --- DEEP POPULATION APPLIED HERE ---
        const order = await Order.findById(req.params.id).populate({
            path: 'items.productId',
            populate: {
                path: 'sellerId',
                select: 'shopName contactNumber storeLocation'
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ success: true, order });
    } catch (error) {
        console.error("Fetch Single Order Error:", error);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
});

// 4. UPDATE ORDER STATUS (For testing / Seller API)
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        let { orderStatus, deliveryPartner } = req.body;
        
        // If the seller/Postman doesn't provide a driver, inject a dummy one automatically
        if (!deliveryPartner && (orderStatus === 'Preparing' || orderStatus === 'Out for Delivery')) {
            deliveryPartner = {
                name: "Ramesh (Test Driver)",
                phone: "+91 98765 43210"
            };
        }
        
        // --- DEEP POPULATION APPLIED HERE ---
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    orderStatus: orderStatus, 
                    ...(deliveryPartner && { deliveryPartner }) 
                }
            },
            { new: true }
        ).populate({
            path: 'items.productId',
            populate: {
                path: 'sellerId',
                select: 'shopName contactNumber storeLocation'
            }
        });

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, message: 'Order updated successfully', order: updatedOrder });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;