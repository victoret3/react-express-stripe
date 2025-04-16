const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Endpoint para verificar el estado de un NFT
router.get('/api/nft-status', async (req, res) => {
  // CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Se requiere sessionId' });
  }
  
  try {
    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Verificar si es una sesión de NFT
    const metadata = session.metadata || {};
    const isNFT = metadata.type === 'lazy_mint' || metadata.type === 'nft';
    
    if (!isNFT) {
      return res.status(400).json({ 
        error: 'Esta sesión no corresponde a un NFT',
        type: metadata.type || 'desconocido' 
      });
    }
    
    // Estado del NFT
    const nftStatus = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      paymentSuccess: session.payment_status === 'paid',
      tokenId: metadata.token_id || metadata.nftId || metadata.lazyId,
      nftName: metadata.name || 'NFT',
      isMinted: metadata.nft_minted === 'true',
      txHash: metadata.transaction_hash || null,
      mintedAt: metadata.minted_at || null,
      isSimulation: metadata.is_simulation === 'true',
      canClaim: session.payment_status === 'paid' && metadata.nft_minted !== 'true'
    };
    
    return res.status(200).json(nftStatus);
  } catch (error) {
    console.error('Error al consultar estado de NFT:', error);
    return res.status(500).json({ 
      error: 'Error al consultar estado del NFT', 
      details: error.message 
    });
  }
});

module.exports = router; 