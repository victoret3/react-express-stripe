// backend/api/payment/session-initiate.js
// API Route para Vercel: CORS y Stripe Checkout Session
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers para todas las respuestas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parsear body si viene como string (Vercel a veces no lo parsea)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { lineItems, successUrl, cancelUrl, name, email, metadata } = body;

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Configuración de Stripe incompleta' });
    return;
  }
  if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
    res.status(400).json({ error: 'Se requiere al menos un item para crear la sesión' });
    return;
  }

  const finalSuccessUrl = successUrl || 'https://naniboron.web.app/success?session_id={CHECKOUT_SESSION_ID}';
  const finalCancelUrl = cancelUrl || 'https://naniboron.web.app/tienda-online';

  try {
    // LOG: Mostrar cómo llegan los lineItems del frontend
    console.log('🟠 lineItems recibidos del frontend:', JSON.stringify(lineItems, null, 2));
    // Añadir mongoProductId a cada line_item.metadata si no está
    const lineItemsWithMongoId = lineItems.map(item => {
      // Inicializa estructuras si no existen
      item.price_data = item.price_data || {};
      item.price_data.product_data = item.price_data.product_data || {};
      item.price_data.product_data.metadata = item.price_data.product_data.metadata || {};
      // Compatibilidad: añade mongoProductId si existe
      if (item.mongoProductId) {
        item.price_data.product_data.metadata.mongoProductId = item.mongoProductId;
      }
      // NO añadir item.price_data.metadata, Stripe no lo permite
      return item;
    });
    // LOG: Mostrar cómo quedan los lineItems que se envían a Stripe
    console.log('🔵 lineItems enviados a Stripe:', JSON.stringify(lineItemsWithMongoId, null, 2));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItemsWithMongoId,
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: email,
      metadata: {
        ...metadata,
        items: JSON.stringify(lineItemsWithMongoId.map(item => ({
          productId: item.price_data?.product_data?.metadata?.productId,
          quantity: item.quantity
        })))
      }
    });
    res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error creando sesión de Stripe' });
  }
};
