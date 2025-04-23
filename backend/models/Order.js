const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  email: String,
  items: Array,
  total: Number,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'orders' });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
