import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String, default: 'https://via.placeholder.com/150' },
  stock: { type: Number, default: 1 },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
