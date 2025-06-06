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

  const finalSuccessUrl = successUrl || 'https://naniboronat.com/success?session_id={CHECKOUT_SESSION_ID}';
  const finalCancelUrl = cancelUrl || 'https://naniboronat.com/tienda-online';

  try {
    // LOG: Mostrar cómo llegan los lineItems del frontend
    console.log('🟠 lineItems recibidos del frontend:', JSON.stringify(lineItems, null, 2));
    // Añadir mongoProductId a cada line_item.metadata si no está
    // Función recursiva para convertir cualquier unit_amount decimal a entero (céntimos)
function fixUnitAmount(obj) {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key === 'unit_amount' && obj[key] !== undefined) {
        const original = obj[key];
        let value = Number(obj[key]);
        // Si es decimal o menor de 100, multiplica por 100 y redondea
        // SIEMPRE multiplica por 100, sin importar el formato
if (typeof obj[key] === 'string') {
  value = Number(obj[key]);
}
if (isNaN(value)) {
  throw new Error(`unit_amount inválido: ${obj[key]}`);
}
value = parseInt(Number(value).toFixed(2).replace('.', ''), 10);
obj[key] = value;
console.log(`[FIX][rec] unit_amount original: ${original} -> final: ${value}`);
      } else if (typeof obj[key] === 'object') {
        fixUnitAmount(obj[key]);
      }
    }
  }
  return obj;
}

console.log('🟡 lineItems recibidos del frontend (ANTES DE FIX):', JSON.stringify(lineItems, null, 2));
const lineItemsWithMongoId = lineItems.map(item => {
  // Inicializa estructuras si no existen
  item.price_data = item.price_data || {};
  item.price_data.product_data = item.price_data.product_data || {};
  item.price_data.product_data.metadata = item.price_data.product_data.metadata || {};
  // Compatibilidad: añade mongoProductId si existe
  if (item.mongoProductId) {
    item.price_data.product_data.metadata.mongoProductId = item.mongoProductId;
  }
  // Aplica fix recursivo a todo el item
  return fixUnitAmount(item);
});
console.log('🟢 unit_amount enviados a Stripe (DESPUÉS DE FIX):', lineItemsWithMongoId.map(i => i.price_data?.unit_amount || i.unit_amount));
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
