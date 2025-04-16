const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware para permitir CORS específico
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Endpoint para iniciar checkout de NFT
router.post('/session', async (req, res) => {
  try {
    console.log('📝 Recibida solicitud para iniciar sesión NFT checkout');
    console.log('Body:', JSON.stringify(req.body));
    
    const { lazyId, email, metadataUrl } = req.body;
    
    if (!lazyId || !email) {
      return res.status(400).json({ 
        error: 'Se requieren lazyId y email para la compra',
        received: { lazyId, email }
      });
    }
    
    // Precio fijo para NFTs
    const priceEur = 20; // 20 euros
    
    // Crear sesión de pago
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
      success_url: `${process.env.FRONTEND_URL || 'https://naniboron.web.app'}/nft-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://naniboron.web.app'}/lazy-mint`,
      customer_email: email,
      metadata: {
        lazyId,
        metadataUrl,
        type: 'lazy_mint',
        useFixedPrice: 'true'
      }
    });
    
    console.log('✅ Sesión de pago NFT creada:', session.id);
    
    return res.status(200).json({ 
      url: session.url, 
      sessionId: session.id 
    });
  } catch (error) {
    console.error('❌ Error al crear sesión de pago NFT:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 