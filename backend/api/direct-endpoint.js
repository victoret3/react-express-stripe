const Stripe = require('stripe');

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Establecer encabezados CORS directamente
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verificar que sea GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  console.log('⚡ Recibida solicitud a direct-endpoint');
  console.log('Query params:', req.query);
  
  // Obtener parámetros de la URL
  const { lazyId, email, metadataUrl, walletAddress } = req.query;
  
  if (!lazyId || !walletAddress) {
    return res.status(400).json({ 
      error: 'Se requieren lazyId y walletAddress como parámetros',
      received: req.query
    });
  }
  
  try {
    // Precio fijo para NFT
    const priceEur = 20; // 20 euros
    
    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `NFT Nani Boronat (#${lazyId})`,
            description: 'NFT Exclusivo de Nani Boronat - Edición Limitada',
            images: ['https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png'],
          },
          unit_amount: priceEur * 100, // Convertir a céntimos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://naniboron.web.app/nft-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://naniboron.web.app/lazy-mint',
      metadata: {
        lazyId,
        metadataUrl,
        type: 'lazy_mint',
        walletAddress
      },
      customer_email: email || undefined
    });
    
    console.log('✅ Sesión creada:', session.id);
    
    // Redirigir directamente a la página de checkout
    res.redirect(302, session.url);
    
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    res.status(500).json({ error: error.message });
  }
}; 