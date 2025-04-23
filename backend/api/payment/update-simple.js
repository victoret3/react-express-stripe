// backend/api/payment/update-simple.js
const Product = require('../../models/Product'); // Ajusta la ruta/modelo si es necesario

module.exports = async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    product.stock = Math.max(0, product.stock - quantity);
    await product.save();
    return res.json({ success: true, stock: product.stock });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};