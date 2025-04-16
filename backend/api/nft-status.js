// Importar dependencias
const Stripe = require('stripe');
require('dotenv').config();

// Configurar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Función principal que maneja las solicitudes
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder a solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener el sessionId de la URL
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Se requiere el parámetro sessionId' });
    }

    console.log(`Verificando estado del NFT para sesión: ${sessionId}`);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Verificar el estado del pago
    const paymentStatus = session.payment_status;

    // Verificar si la sesión es de tipo NFT
    const metadata = session.metadata || {};
    const isNFT = metadata.type === 'lazy_mint' || metadata.type === 'nft';
    
    // Si no es un NFT, retornar error
    if (!isNFT) {
      return res.status(400).json({ 
        error: 'Esta sesión no corresponde a un NFT',
        sessionType: metadata.type || 'desconocido'
      });
    }

    // Obtener el ID del NFT
    const nftId = metadata.nftId || metadata.lazyId || metadata.token_id || null;
    
    // Estado del NFT
    const nftStatus = metadata.nft_status || 'pending';
    const alreadyMinted = metadata.nft_minted === 'true';
    const txHash = metadata.transaction_hash || null;
    const mintedAt = metadata.minted_at || null;
    const isSimulation = metadata.is_simulation === 'true';

    // Construir respuesta
    const response = {
      sessionId,
      nftId,
      paymentStatus,
      nftStatus,
      customerEmail: session.customer_email,
      amount: session.amount_total / 100, // Convertir de céntimos a euros
      currency: session.currency,
      minteado: alreadyMinted,
      listo_para_mintear: nftStatus === 'ready_to_mint' && paymentStatus === 'paid' && !alreadyMinted,
      transactionHash: txHash,
      mintedAt,
      isSimulation,
      metadata
    };

    // Agregar información extra para depuración
    console.log(`NFT status para sesión ${sessionId}:`, {
      nftId,
      paymentStatus,
      nftStatus,
      minteado: alreadyMinted
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error al verificar estado del NFT:', error);
    return res.status(500).json({ 
      error: 'Error al obtener información del NFT',
      details: error.message
    });
  }
}; 