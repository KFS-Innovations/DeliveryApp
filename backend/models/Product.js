const mongoose = require('mongoose');

const ProductsSchema = new mongoose.Schema({
  name: String,
  shop: String,
  
  shopAddress: String,
  shopLocation: {
    latitude: Number,
    longitude: Number
  },

  time: String,
  rating: String,
  reviews: String,
  deliveryNote: String,
  price: String,
  image: String,
  description: String,
  sellerPhone: String,
  category: String,
  isFavorite: { type: Boolean, default: false }
});

module.exports = mongoose.model('Products', ProductsSchema, 'Products');