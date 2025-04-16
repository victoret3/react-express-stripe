const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Sin middleware CORS adicional, usamos el global de index.js

// Endpoint para iniciar checkout de NFT - extremadamente simplificado
router.post('/session', async (req, res) => {
  // Asegurar encabezados CORS para esta ruta
  res.header('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('📝 Solicitud recibida para crear sesión NFT');
    console.log('Body:', JSON.stringify(req.body));
    
    const { lazyId, walletAddress, email, metadataUrl } = req.body;
    
    // Crear sesión básica
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `NFT Nani Boronat (#${lazyId})`,
            description: 'NFT Exclusivo de Nani Boronat - Edición Limitada',
            images: ['https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png'],
          },
          unit_amount: 2000, // 20 EUR
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
      }
    };
    
    if (email) {
      sessionConfig.customer_email = email;
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('✅ Sesión creada:', session.id);
    
    return res.status(200).json({ 
      url: session.url, 
      sessionId: session.id 
    });
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 