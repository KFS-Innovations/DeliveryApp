const mongoose = require('mongoose');

const ProductsSchema = new mongoose.Schema({
  // Link this product directly to the Seller who created it
  sellerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'sellers',
    required: true 
  },
  
  // Product-specific details
  name: { type: String, required: true },
  description: String,
  price: String, 
  image: String,
  category: String,
  
  // Optional / Metric fields
  time: String,
  rating: String,       
  reviews: String,      
  deliveryNote: String, 
  isFavorite: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true },

}, { timestamps: true });

// Inside models/Product.js
module.exports = mongoose.model('Products', ProductsSchema, 'Products');