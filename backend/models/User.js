const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  
  addresses: [
    {
      houseDetails: { type: String, required: true },
      areaDetails: { type: String, required: true },
      landmark: { type: String, default: "" },
      fullAddress: { type: String, required: true },
      isDefault: { type: Boolean, default: false },
      
      location: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema, 'Users');