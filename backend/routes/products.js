const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken');

const ALLOWED_PRODUCT_FIELDS = [
  'name',
  'description',
  'price',
  'image',
  'category',
  'time',
  'deliveryNote',
  'rating',
  'reviews',
  'inStock'
];

const pickAllowedFields = (body = {}) => {
  const payload = {};
  for (const key of ALLOWED_PRODUCT_FIELDS) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }
  return payload;
};

// 1. GET SELLER'S SPECIFIC PRODUCTS
router.get('/seller', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Fetch Seller Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// 2. ADD A NEW PRODUCT (Seller only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const fields = pickAllowedFields(req.body);

    const newProduct = new Product({
      sellerId: req.user.id,
      ...fields,
      inStock: fields.inStock !== undefined ? Boolean(fields.inStock) : true
    });

    await newProduct.save();
    res.json({ success: true, message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// 3. UPDATE PRODUCT (Seller only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findOne({ _id: productId, sellerId: req.user.id });
    if (!product) {
      return res.status(403).json({ error: 'Not authorized to edit this product' });
    }

    const updates = pickAllowedFields(req.body);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 4. GET ALL PRODUCTS (Public route for the Buyer App Home Screen)
router.get('/', async (req, res) => {
  try {
    const productsList = await Product.find().populate(
      'sellerId',
      'shopName contactNumber storeLocation isOpen isActive'
    );

    if (productsList.length === 0) {
      return res.json([
        {
          _id: '111111111111111111111111',
          name: 'Fresh Coconut (Fallback)',
          time: '25 min',
          rating: '4.9',
          reviews: '120+',
          deliveryNote: '₹0 Delivery fee',
          price: '₹40',
          image: 'https://images.unsplash.com/photo-1526653054275-4a4f37eb1d7f?w=400',
          description: 'Farm fresh coconuts harvested daily from the backwaters of Kerala.',
          category: 'Coconut',
          isFavorite: false,
          sellerId: {
            shopName: 'Kerala Farms',
            contactNumber: '+919876543210',
            isOpen: true,
            isActive: true,
            storeLocation: {
              address: 'Marine Drive, Ernakulam, Kerala',
              latitude: 10.015,
              longitude: 76.225
            }
          }
        }
      ]);
    }

    const openShopProducts = productsList.filter(
      (product) => product.sellerId && product.sellerId.isOpen !== false
    );

    res.json(openShopProducts);
  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

module.exports = router;