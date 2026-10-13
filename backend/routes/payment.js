const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

// Initialize Razorpay with your Test API Keys from the Razorpay Dashboard
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post('/generate-link', async (req, res) => {
    try {
        const { amount, name, phone, email } = req.body;
        
        const paymentLinkRequest = {
            amount: Math.round(amount * 100),
            currency: "INR",
            description: "Food Delivery Order",
            customer: {
                name: name || "Customer",
                contact: phone || "+919746026325",
                email: email || "ansifpta0@gmail.com"
            },
            notify: { sms: false, email: false },
            reminder_enable: false,
            // The WebView will intercept this exact URL to know when to close
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

const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');

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

module.exports = router;