const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');

// IMPORTANT: Import your models here so the webhook can access the database!
const Cart = require('../models/Cart'); 
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const calculateDistance = require('../utils/distance');

// Initialize Razorpay with your Test API Keys from the Razorpay Dashboard
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. GENERATE LINK ROUTE (Frontend calls this to get the WebView URL)
// 1. GENERATE LINK ROUTE WITH DYNAMIC DISTANCE & DELIVERY FEE RE-CALCULATION
router.post('/generate-link', async (req, res) => {
    try {
        const { name, phone, email, userId, deliveryAddress, latitude, longitude, paymentMethod } = req.body; 
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Use coordinates sent from the frontend, or fall back to user's database record
        const userLat = latitude || user.location?.latitude;
        const userLng = longitude || user.location?.longitude;

        if (!userLat || !userLng) {
            return res.status(400).json({ error: 'Please set your active delivery location coordinates.' });
        }

        // Fetch the user's cart and populate product/shop details
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty.' });
        }

        let maxDistance = 0;
        let subtotal = 0;

        // Loop through items to calculate subtotal and find the furthest shop distance
        for (let item of cart.items) {
            const product = item.productId;
            if (!product) continue;

            const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
            subtotal += numericPrice * item.quantity;

            if (product.shopLocation && product.shopLocation.latitude && product.shopLocation.longitude) {
                const distance = calculateDistance(
                    userLat,
                    userLng,
                    parseFloat(product.shopLocation.latitude),
                    parseFloat(product.shopLocation.longitude)
                );

                // 1. Block if greater than 15km
                if (distance > 15) {
                    return res.status(400).json({ 
                        error: `Delivery unavailable. This shop is too far away to deliver fresh items to your current location.` 
                    });
                }

                // 2. Track the furthest shop to calculate accurate delivery fee
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            }
        }

        // Recalculate exact delivery fee on the backend: ₹15 per km (minimum ₹40)
        const calculatedDeliveryFee = Math.max(40, Math.ceil(maxDistance * 15));
        const finalTotalAmount = subtotal + calculatedDeliveryFee;

        // Generate Razorpay payment link with the newly calculated total amount
        const paymentLinkRequest = {
            amount: Math.round(finalTotalAmount * 100), // Razorpay accepts amounts in paisa
            currency: "INR",
            description: "Food Delivery Order",
            customer: {
                name: name || user?.name || "Customer",
                contact: phone || user?.phone || "+910000000000",
                email: email || user?.email || "no-reply@yourdomain.com"
            },
            notes: {
                userId: userId,
                deliveryAddress: deliveryAddress,
            },
            notify: { sms: false, email: false },
            reminder_enable: false,
            callback_url: "https://example-callback-url.com/paymentsuccess", 
            callback_method: "get"
        };
    
        const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);
        res.json({ payment_url: paymentLink.short_url, totalAmount: finalTotalAmount });
        
    } catch (error) {
        console.error("Razorpay Link Error:", error);
        res.status(500).json({ error: "Failed to generate payment link" });
    }
});

// 2. VERIFY LINK ROUTE (Frontend calls this when the WebView closes successfully)
router.post('/verify-link', async (req, res) => {
    try {
        const { 
            razorpay_payment_id, 
            razorpay_payment_link_id, 
            razorpay_payment_link_reference_id,  
            razorpay_payment_link_status, 
            razorpay_signature 
        } = req.body;

        // Cryptographically verify the signature using your secret key
        const isValid = validatePaymentVerification({
            "payment_link_id": razorpay_payment_link_id,
            "payment_id": razorpay_payment_id,
            "payment_link_reference_id": razorpay_payment_link_reference_id || "",
            "payment_link_status": razorpay_payment_link_status
        }, razorpay_signature, process.env.RAZORPAY_KEY_SECRET);

        if (isValid && razorpay_payment_link_status === 'paid') {
            res.json({ success: true, message: "Payment verified and order placed!" });
        } else {
            res.status(400).json({ error: "Invalid payment signature." });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: "Failed to verify payment." });
    }
});

// 3. WEBHOOK ROUTE (Razorpay calls this directly in the background)
router.post('/webhook', express.json(), async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    try {
        // Manually verify the signature using crypto
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature === signature) {
            const event = req.body.event;
            
            if (event === 'payment_link.paid') {
                const paymentLinkData = req.body.payload.payment_link.entity;
                
                // SAFELY extract the userId we attached earlier
                const userId = paymentLinkData.notes ? paymentLinkData.notes.userId : null; 
                const deliveryAddress = paymentLinkData.notes ? paymentLinkData.notes.deliveryAddress : "Address missing";
                const paymentId = paymentLinkData.id;

                // If userId is missing, log it and stop processing, but still return 200 to Razorpay
                if (!userId) {
                    console.error("❌ Webhook ignored: No userId found in payment notes.");
                    return res.status(200).send("Webhook received but ignored (missing userId)");
                }

                console.log("✅ Webhook triggered! Processing order for User:", userId);

                try {
                    // 1. Fetch the user's cart
                    const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
                    
                    if (cart && cart.items.length > 0) {
                        
                        // FIX: Filter out items where the product reference is null before mapping
                        const validItems = cart.items.filter(item => item.productId != null);
                        
                        // 2. Format items for the order using ONLY the valid items
                        const orderItems = validItems.map(item => ({
                            productId: item.productId._id,
                            quantity: item.quantity,
                            price: parseFloat(item.productId.price.replace(/[^0-9.]/g, ''))
                        }));

                        // 3. Create the new Paid order
                        const newOrder = new Order({
                            userId: userId,
                            items: orderItems,
                            totalAmount: (paymentLinkData.amount / 100), // Convert back to standard rupees
                            paymentMethod: 'razorpay',
                            paymentStatus: 'Paid',
                            transactionId: paymentId,
                            deliveryAddress: deliveryAddress
                        });

                        await newOrder.save();

                        // 4. Clear the cart
                        cart.items = [];
                        await cart.save();
                        
                        console.log("🛒 Order saved and cart cleared successfully!");
                    }
                } catch (dbError) {
                    console.error("Database Error in Webhook:", dbError);
                }
            }
            
            // Always return a 200 status so Razorpay knows you received it
            res.status(200).send("Webhook received");
        } else {
            console.error("❌ Invalid webhook signature");
            res.status(400).send("Invalid signature");
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;