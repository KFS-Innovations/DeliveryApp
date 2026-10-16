// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true }, // 'cod', 'upi', 'card'
    paymentStatus: { type: String, default: 'Pending' }, // 'Pending', 'Paid'
    orderStatus: { type: String, default: 'Placed' }, // 'Placed', 'Preparing', 'Out for Delivery'
    createdAt: { type: Date, default: Date.now },

    deliveryPartner: {
        name: { type: String },
        phone: { type: String }
    }
});

module.exports = mongoose.model('Order', OrderSchema);