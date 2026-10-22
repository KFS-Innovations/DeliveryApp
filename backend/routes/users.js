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
      { returnDocument: 'after' }
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

// --- GET DELIVERY ADDRESSES ROUTE ---
// GET /api/user/address
router.get('/address', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Return the array of addresses instead of a single string
        res.json({ success: true, addresses: user.addresses || [] });
    } catch (error) {
        console.error("Get Address Error:", error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// --- ADD NEW DELIVERY ADDRESS ROUTE ---
// POST /api/user/address  <-- Changed to POST since we are appending to an array
router.post('/address', verifyToken, async (req, res) => {
    try {
        const { houseDetails, areaDetails, landmark, fullAddress } = req.body;
        
        const newAddress = {
            houseDetails,
            areaDetails,
            landmark,
            fullAddress,
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            { $push: { addresses: newAddress } }, // Use $push to add to the array
            { returnDocument: 'after' }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, addresses: updatedUser.addresses });
    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ error: 'Failed to save new address' });
    }
});

module.exports = router;