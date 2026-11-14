const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'sellers', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, enum: ['Bike', 'Scooter', 'Van'], default: 'Bike' },
  vehicleNumber: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);