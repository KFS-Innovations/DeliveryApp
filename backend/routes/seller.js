const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller'); 
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');

const verifyToken = require('../middleware/verifyToken');

// 1. Get Seller Profile (GET /api/seller/profile)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // req.user.id comes from your verifyToken middleware
        const seller = await Seller.findById(req.user.id).select('-password'); 
        
        if (!seller) {
            return res.status(404).json({ error: 'Seller profile not found' });
        }

        res.json({ seller });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        res.status(500).json({ error: 'Server error while fetching profile' });
    }
});

// 2. Update Seller Profile (PUT /api/seller/update-profile)
router.put('/update-profile', verifyToken, async (req, res) => {
    const { shopName, email, contactNumber, storeLocation } = req.body;

    try {
        const seller = await Seller.findById(req.user.id);
        
        if (!seller) {
            return res.status(404).json({ error: 'Seller profile not found' });
        }

        // If the email is being changed, verify the new email isn't already taken
        if (email && email !== seller.email) {
            const emailExists = await Seller.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ error: 'This email is already in use by another shop.' });
            }
        }

        // Update basic details
        if (shopName) seller.shopName = shopName;
        if (email) seller.email = email;
        if (contactNumber) seller.contactNumber = contactNumber;

        // Update store location securely
        if (storeLocation && storeLocation.address && storeLocation.latitude && storeLocation.longitude) {
            seller.storeLocation = {
                address: storeLocation.address,
                latitude: parseFloat(storeLocation.latitude),
                longitude: parseFloat(storeLocation.longitude)
            };
        }

        await seller.save();

        // Return the updated seller (excluding password)
        const updatedSeller = await Seller.findById(req.user.id).select('-password');
        
        res.json({ 
            success: true, 
            message: 'Store profile updated successfully', 
            seller: updatedSeller 
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: 'Server error while updating profile' });
    }
});

router.get('/dashboard-stats', verifyToken, async (req, res) => {
    try {
        const sellerId = req.user.id;

        // 1. Get all products owned by this seller
        const sellerProducts = await Product.find({ sellerId });
        const productIdsStr = sellerProducts.map(p => p._id.toString());
        
        // Count products that are currently in stock
        const activeProductsCount = sellerProducts.filter(p => p.inStock !== false).length;

        // 2. Get all orders containing any of this seller's products
        const orders = await Order.find({ 'items.productId': { $in: sellerProducts.map(p => p._id) } });

        let newOrdersCount = 0;
        let activeOrdersCount = 0;
        let todaysEarnings = 0;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        orders.forEach(order => {
            const status = order.orderStatus || 'Pending';

            // New Orders (Just placed, waiting for seller action)
            if (status === 'Pending' || status === 'Placed') {
                newOrdersCount++;
            }

            // Active Orders (Not yet delivered or cancelled)
            if (status !== 'Delivered' && status !== 'Cancelled') {
                activeOrdersCount++;
            }

            // Today's Earnings (Only summing the items belonging to THIS seller)
            const isToday = new Date(order.createdAt) >= startOfToday;
            if (isToday && order.paymentStatus === 'Paid') {
                order.items.forEach(item => {
                    if (item.productId && productIdsStr.includes(item.productId.toString())) {
                        todaysEarnings += (item.price * item.quantity);
                    }
                });
            }
        });

        res.json({
            newOrders: newOrdersCount,
            activeOrders: activeOrdersCount,
            activeProducts: activeProductsCount,
            todaysEarnings: todaysEarnings
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

//Delivery Partner Section
router.get('/delivery-partners', verifyToken, async (req, res) => {
    try {
        const partners = await DeliveryPartner.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
        res.json({ partners });
    } catch (error) {
        console.error("Fetch Partners Error:", error);
        res.status(500).json({ error: 'Failed to fetch delivery partners' });
    }
});

// 2. Add a new delivery partner
router.post('/delivery-partners', verifyToken, async (req, res) => {
    try {
        const { name, phone, vehicleType, vehicleNumber } = req.body;

        if (!name || !phone || !vehicleNumber) {
            return res.status(400).json({ error: 'Name, phone, and vehicle number are required' });
        }

        const newPartner = new DeliveryPartner({
            sellerId: req.user.id,
            name,
            phone,
            vehicleType: vehicleType || 'Bike',
            vehicleNumber
        });

        await newPartner.save();
        res.status(201).json({ message: 'Partner added successfully', partner: newPartner });
    } catch (error) {
        console.error("Add Partner Error:", error);
        res.status(500).json({ error: 'Failed to add delivery partner' });
    }
});

// 3. Update delivery partner status (Active/Inactive)
router.put('/delivery-partners/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const partner = await DeliveryPartner.findOneAndUpdate(
            { _id: req.params.id, sellerId: req.user.id }, // Ensure the seller owns this partner
            { status: status },
            { new: true }
        );

        if (!partner) {
            return res.status(404).json({ error: 'Delivery partner not found' });
        }

        res.json({ message: 'Status updated', partner });
    } catch (error) {
        console.error("Update Partner Status Error:", error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// 4. Delete a delivery partner
router.delete('/delivery-partners/:id', verifyToken, async (req, res) => {
    try {
        const partner = await DeliveryPartner.findOneAndDelete({ 
            _id: req.params.id, 
            sellerId: req.user.id 
        });

        if (!partner) {
            return res.status(404).json({ error: 'Delivery partner not found' });
        }

        res.json({ message: 'Delivery partner removed successfully' });
    } catch (error) {
        console.error("Delete Partner Error:", error);
        res.status(500).json({ error: 'Failed to remove delivery partner' });
    }
});

router.patch('/status', verifyToken, async (req, res) => {
  try {
    const { sellerId, isOpen } = req.body;
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      { isOpen: Boolean(isOpen) },
      { new: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json({ success: true, isOpen: updatedSeller.isOpen });
  } catch (err) {
    console.error('Error updating store status:', err);
    res.status(500).json({ error: 'Failed to update store status' });
  }
});


module.exports = router;