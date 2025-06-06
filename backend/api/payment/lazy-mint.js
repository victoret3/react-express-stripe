// backend/api/payment/lazy-mint.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS headers para todas las respuestas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

  const { lazyId, email, contractAddress, walletAddress, metadataUrl } = body;
  if (!lazyId || !email || !contractAddress) {
    res.status(400).json({ error: 'lazyId, email y contractAddress son obligatorios' });
    return;
  }

  // Precio dinámico recibido del frontend o valor por defecto
  const priceEur = typeof body.priceEur === 'number' ? body.priceEur : 20;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `NFT Nani Boronat (#${lazyId})`,
            description: 'NFT Exclusivo de Nani Boronat - Edición Limitada',
            images: ['https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png'],
            metadata: { lazyId }
          },
          unit_amount: priceEur * 100, // 20€ en céntimos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/mint/${contractAddress}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/colecciones`,
      customer_email: email,
      metadata: {
        lazyId,
        metadataUrl,
        contractAddress,
        walletAddress,
        type: 'lazy_mint',
        useFixedPrice: 'true'
      }
    });
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creando la sesión de Stripe para lazy mint:', error);
    return res.status(500).json({ error: error.message });
  }
};
