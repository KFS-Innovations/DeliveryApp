const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// --- UPDATE LOCATION ROUTE ---
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
      { new: true } // Returns the updated document
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

module.exports = router;