const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');

// IMPORTANT: Import your models here so the webhook can access the database!
// (Adjust the path '../models/...' if your models are located somewhere else)
const Cart = require('../models/Cart'); 
const Order = require('../models/Order');

// Initialize Razorpay with your Test API Keys from the Razorpay Dashboard
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. GENERATE LINK ROUTE (Frontend calls this to get the WebView URL)
router.post('/generate-link', async (req, res) => {
    try {
        const { amount, name, phone, email, userId, deliveryAddress } = req.body; 
        
        const paymentLinkRequest = {
            amount: Math.round(amount * 100),
            currency: "INR",
            description: "Food Delivery Order",
            customer: {
                name: name || "Customer",
                contact: phone || "+919746026325",
                email: email || "ansifpta0@gmail.com"
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
        res.json({ payment_url: paymentLink.short_url });
        
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

// 3. NEW: WEBHOOK ROUTE (Razorpay calls this directly in the background)
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
                    // 1. Fetch the user's cart (Notice uppercase 'Cart')
                    const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
                    
                    if (cart && cart.items.length > 0) {
                        // 2. Format items for the order
                        const orderItems = cart.items.map(item => ({
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