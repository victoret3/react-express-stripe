// backend/api/payment/order.js
const Order = require('../../models/Order'); // Ajusta la ruta/modelo si es necesario

module.exports = async (req, res) => {
  const start = Date.now();
  console.log('--- [ORDER API] ---');
  console.log(`[ORDER] Method: ${req.method}`);
  console.log(`[ORDER] Query:`, req.query);
  // Permitir CORS para el dominio de producción y localhost
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
  if (req.method === 'OPTIONS') {
    console.log('[ORDER] OPTIONS preflight, saliendo');
    return res.status(200).end();
  }
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    console.log('[ORDER] FALTA sessionId');
    return res.status(400).json({ error: 'sessionId is required' });
  }
  try {
    // Log de conexión a Mongo
    const mongoose = require('mongoose');
    console.log(`[ORDER] Estado conexión Mongo: ${mongoose.connection.readyState}`);
    if (mongoose.connection.readyState !== 1) {
      console.log('[ORDER] Conectando a Mongo...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('[ORDER] Conectado a Mongo');
    }
    console.log(`[ORDER] Buscando order con sessionId: ${sessionId}`);
    const order = await Order.findOne({ sessionId });
    console.log('[ORDER] Resultado búsqueda:', order);
    if (!order) {
      console.log('[ORDER] Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log('[ORDER] Order encontrada, devolviendo:', order);
    // Mapear los campos a lo que espera el frontend
    const mappedOrder = {
      orderNumber: order.sessionId || order._id,
      email: order.email,
      totalAmount: order.total,
      items: (order.items || []).map(item => ({
        id: item.productId || item.stripeProductId || item._id,
        name: item.description || item.name,
        price: item.price,
        quantity: item.quantity,
        mongoProductId: item.mongoProductId || null,
        image: item.image || null
      })),
      createdAt: order.createdAt
    };
    console.log('[ORDER] Respuesta mapeada:', mappedOrder);
    console.log(`[ORDER] Tiempo total: ${Date.now() - start}ms`);
    return res.json({ order: mappedOrder });
  } catch (error) {
    console.error('[ORDER] ERROR:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};