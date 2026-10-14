const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// --- UPDATE GPS LOCATION ROUTE ---
// PUT /api/user/location
router.put('/location', verifyToken, async (req, res) => {
  const { latitude, longitude, address } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          'location.latitude': latitude,
          'location.longitude': longitude,
          'location.address': address
        } 
      },
      { returnDocument: 'after' } // <--- Fixed the Mongoose warning here!
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Location updated successfully', location: updatedUser.location });
  } catch (error) {
    console.error("Location Update Error:", error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// --- GET DELIVERY ADDRESS ROUTE ---
// GET /api/user/address
router.get('/address', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ address: user.deliveryAddress || "Please add a delivery address" });
    } catch (error) {
        console.error("Get Address Error:", error);
        res.status(500).json({ error: 'Failed to fetch address' });
    }
});

// --- UPDATE DELIVERY ADDRESS ROUTE ---
// PUT /api/user/address
router.put('/address', verifyToken, async (req, res) => {
    try {
        const { address } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            { $set: { deliveryAddress: address } },
            { returnDocument: 'after' }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, address: updatedUser.deliveryAddress });
    } catch (error) {
        console.error("Update Address Error:", error);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

module.exports = router;