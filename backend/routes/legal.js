const express = require('express');
const router = express.Router();

const policies = {
    'contact': `
        <h1>Contact Us</h1>
        <p><strong>Get in Touch</strong><br>We are here to help you with your fresh food orders. Reach out to our support team for any queries regarding your delivery, products, or payments.</p>
        <ul>
            <li><strong>Business Name:</strong> [Your Official Business Name]</li>
            <li><strong>FSSAI License No:</strong> [Your 14-digit FSSAI Number]</li>
            <li><strong>Customer Support Phone:</strong> [Your Support Phone Number]</li>
            <li><strong>Email Address:</strong> [Your Support Email]</li>
            <li><strong>Operating Hours:</strong> Monday to Sunday, 8:00 AM - 9:00 PM</li>
            <li><strong>Registered Address:</strong> [Your Physical Business Address, Kerala, India - ZIP]</li>
        </ul>
    `,
    'terms': `
        <h1>Terms and Conditions</h1>
        <p><em>Last Updated: November 2026</em></p>
        <h3>1. General Use</h3>
        <p>This platform facilitates the sale and delivery of fresh meat, fish, pure oils, and coconuts. You must be at least 18 years of age to register and make purchases.</p>
        <h3>2. Product Accuracy</h3>
        <p>Fresh cuts of meat and fish may vary slightly in weight and appearance from the images shown. We charge based on precise weight logic, and any significant discrepancy will be addressed by our support team.</p>
        <h3>3. User Accounts</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate location and contact information to ensure successful delivery.</p>
        <h3>4. Pricing and Availability</h3>
        <p>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue products based on daily stock and market availability.</p>
        <h3>5. Limitation of Liability</h3>
        <p>Our business shall not be liable for any indirect, incidental, or consequential damages resulting from the use of our service or the consumption of our products beyond the replacement or refund of the specific order.</p>
    `,
    'privacy': `
        <h1>Privacy Policy</h1>
        <p><em>Last Updated: November 2026</em></p>
        <h3>1. Information We Collect</h3>
        <ul>
            <li><strong>Personal Data:</strong> Name, phone number, and email address for account creation and communication.</li>
            <li><strong>Location Data:</strong> GPS coordinates and saved addresses to validate our 15 km delivery radius and calculate accurate delivery fees.</li>
            <li><strong>Payment Data:</strong> Handled securely via Razorpay. We do not store your credit card or UPI PIN details on our servers.</li>
        </ul>
        <h3>2. How We Use Your Information</h3>
        <ul>
            <li>To process and deliver your orders accurately.</li>
            <li>To communicate order statuses (e.g., driver dispatch, delays).</li>
            <li>To improve our app's performance and regional product offerings.</li>
        </ul>
        <h3>3. Data Sharing</h3>
        <p>We share necessary details (name, phone, address) strictly with our registered delivery partners to fulfill your order. We do not sell your personal data to third-party marketing agencies.</p>
    `,
    'refunds': `
        <h1>Cancellation & Refunds</h1>
        <p><em>Last Updated: November 2026</em></p>
        <p>Because we deal in fresh, perishable goods (meat, fish, and dairy), our cancellation and refund policies are strict to ensure food safety and quality.</p>
        <h3>1. Order Cancellations</h3>
        <ul>
            <li><strong>Before Processing:</strong> You may cancel your order directly through the app only while the status is "Order Placed".</li>
            <li><strong>After Processing:</strong> Once the order status changes to "Preparing" or "Out for Delivery," cancellations are not permitted as the fresh items have already been cut, packed, or dispatched.</li>
        </ul>
        <h3>2. Refunds and Replacements</h3>
        <ul>
            <li><strong>Quality Issues:</strong> If you receive a spoiled, damaged, or incorrect item, you must report it to our customer support within 2 hours of delivery, accompanied by photographic evidence.</li>
            <li><strong>Refund Process:</strong> Approved refunds will be credited back to your original payment method (via Razorpay) within 5-7 business days, or instantly credited to your in-app Wallet.</li>
            <li><strong>Failed Deliveries:</strong> If a delivery fails due to an incorrect address provided by you, or if you are unreachable, no refunds will be issued for perishable items.</li>
        </ul>
    `,
    'shipping': `
        <h1>Shipping & Delivery</h1>
        <p><em>Last Updated: November 2026</em></p>
        <h3>1. Delivery Zones</h3>
        <p>We currently deliver exclusively within a 15-kilometer radius of our partner shops to guarantee the freshness of our meat and seafood. Orders placed outside this radius will be blocked automatically at checkout.</p>
        <h3>2. Delivery Fees</h3>
        <ul>
            <li>Our base delivery fee is ₹40.</li>
            <li>Deliveries are charged at a dynamic rate of ₹15 per kilometer based on the exact GPS distance between your address and our shop. The final fee is clearly displayed at checkout.</li>
        </ul>
        <h3>3. Delivery Timelines</h3>
        <ul>
            <li>Orders are generally delivered within 30 to 45 minutes of placement.</li>
            <li>ETA is subject to change based on weather conditions, traffic, and high-demand periods.</li>
        </ul>
    `
};

router.get('/:page', (req, res) => {
    const page = req.params.page;
    const content = policies[page];

    if (content) {
        const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Legal - ${page.charAt(0).toUpperCase() + page.slice(1)}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                        line-height: 1.6; 
                        padding: 24px; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        color: #1E293B; 
                        background-color: #F8FAFC;
                    }
                    h1 { color: #10B981; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; }
                    h3 { color: #0F172A; margin-top: 24px; }
                    p, li { font-size: 16px; color: #475569; }
                    ul { margin-top: 8px; margin-bottom: 16px; padding-left: 20px; }
                    li { margin-bottom: 8px; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
        res.send(htmlTemplate);
    } else {
        res.status(404).send('<h1>Page Not Found</h1>');
    }
});

module.exports = router;