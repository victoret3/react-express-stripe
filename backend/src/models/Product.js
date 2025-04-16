const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  stock: { type: Number, default: 0 },
  stripeProductId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Especificar explícitamente el nombre de la colección como 'products'
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

module.exports = Product;
