const express = require('express');
const router = express.Router();
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuración CORS
router.use(cors({
  origin: 'https://naniboron.web.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Para opciones preflight
router.options('*', cors({
  origin: 'https://naniboron.web.app',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Endpoint de estado para verificar disponibilidad
router.get('/status', (req, res) => {
  // Forzar encabezados CORS
  res.header('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    status: 'ok',
    message: 'Servicio de sesiones simplificado funcionando correctamente',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Endpoint simple para crear sesión
router.post('/create', async (req, res) => {
  // Forzar encabezados CORS
  res.header('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    console.log('📝 Recibida solicitud en endpoint simplificado');
    console.log('Body:', JSON.stringify(req.body));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const { lazyId, walletAddress } = req.body;
    
    if (!lazyId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren lazyId y walletAddress',
        received: req.body
      });
    }
    
    // Crear sesión básica
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `NFT Simplificado (#${lazyId})`,
            description: 'NFT Nani Boronat - Edición Limitada',
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
        type: 'simple_nft',
        walletAddress
      }
    });
    
    console.log('✅ Sesión simplificada creada:', session.id);
    
    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('❌ Error al crear sesión simplificada:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 