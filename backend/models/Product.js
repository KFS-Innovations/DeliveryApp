const mongoose = require('mongoose');

const ProductsSchema = new mongoose.Schema({
  name: String,
  shop: String,
  time: String,
  rating: String,
  reviews: String,
  deliveryNote: String,
  price: String,
  image: String,
  description: String, // <-- NEW FIELD
  isFavorite: { type: Boolean, default: false }
});

module.exports = mongoose.model('Products', ProductsSchema, 'Products');