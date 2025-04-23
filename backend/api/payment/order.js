// backend/api/payment/order.js
const Order = require('../../models/Order'); // Ajusta la ruta/modelo si es necesario

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  try {
    const order = await Order.findOne({ sessionId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};