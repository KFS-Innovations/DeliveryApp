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
        res.json({ success: true, addresses: user.addresses || [] });
    } catch (error) {
        console.error("Get Address Error:", error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// --- ADD NEW DELIVERY ADDRESS ROUTE ---
// POST /api/user/address  
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
            { $push: { addresses: newAddress } }, 
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

// --- EDIT/UPDATE DELIVERY ADDRESS ROUTE ---
// PUT /api/user/address/:addressId
router.put('/address/:addressId', verifyToken, async (req, res) => {
    try {
        const { houseDetails, areaDetails, landmark, fullAddress } = req.body;
        const { addressId } = req.params;

        // Use the positional operator ($) to update the specific address inside the array
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id, "addresses._id": addressId },
            { 
                $set: { 
                    "addresses.$.houseDetails": houseDetails,
                    "addresses.$.areaDetails": areaDetails,
                    "addresses.$.landmark": landmark,
                    "addresses.$.fullAddress": fullAddress
                } 
            },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User or Address not found" });
        }

        res.json({ success: true, addresses: updatedUser.addresses });
    } catch (error) {
        console.error("Update Address Error:", error);
        res.status(500).json({ success: false, error: 'Failed to update address' });
    }
});

// --- DELETE DELIVERY ADDRESS ROUTE ---
// DELETE /api/user/address/:addressId
router.delete('/address/:addressId', verifyToken, async (req, res) => {
    try {
        const { addressId } = req.params;

        // Use $pull to remove the address object with the matching _id from the array
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { addresses: { _id: addressId } } },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, addresses: updatedUser.addresses });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ success: false, error: 'Failed to delete address' });
    }
});

module.exports = router;