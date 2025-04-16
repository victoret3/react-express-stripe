// Webhook para manejar eventos de Stripe NFT
const Stripe = require('stripe');
require('dotenv').config();

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Función principal
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, stripe-signature');

  // Responder a solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que estamos recibiendo datos en formato raw para Stripe
  let event;
  try {
    // Obtener la firma del webhook
    const signature = req.headers['stripe-signature'];
    console.log('Headers recibidos:', req.headers);
    console.log('Stripe signature:', signature);

    // Verificar que tenemos la firma
    if (!signature) {
      console.error('No se encontró la firma de Stripe');
      return res.status(400).json({ error: 'No se encontró la firma del webhook' });
    }

    // Verificar que el body sea un Buffer
    if (!Buffer.isBuffer(req.body)) {
      console.error('El body no es un Buffer. Tipo:', typeof req.body);
      return res.status(400).json({ error: 'El formato de datos no es válido' });
    }

    // Construir el evento de Stripe
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log('Evento de Stripe construido correctamente:', event.type);
    } catch (err) {
      console.error('Error verificando la firma del webhook:', err.message);
      return res.status(400).json({ error: `Error de firma: ${err.message}` });
    }
  } catch (err) {
    console.error('Error general al procesar webhook:', err.message);
    return res.status(400).json({ error: err.message });
  }

  // Manejar el evento
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Verificar si es un NFT
      const metadata = session.metadata || {};
      const isNFT = metadata.type === 'lazy_mint' || metadata.type === 'nft';
      
      if (isNFT) {
        console.log('Procesando sesión de NFT completada:', session.id);
        
        // Obtener el ID del NFT
        const nftId = metadata.nftId || metadata.lazyId || null;
        
        if (!nftId) {
          console.error('No se encontró ID de NFT en los metadatos:', metadata);
          return res.status(400).json({ error: 'Metadatos de NFT incompletos' });
        }
        
        try {
          // Actualizar los metadatos de la sesión para indicar que está listo para mintear
          await stripe.checkout.sessions.update(session.id, {
            metadata: {
              ...metadata,
              nft_status: 'ready_to_mint',
              processed_at: new Date().toISOString(),
              token_id: nftId
            }
          });
          
          console.log(`✅ Sesión ${session.id} actualizada, NFT ${nftId} listo para ser minteado`);
          
          return res.status(200).json({
            received: true,
            nftId: nftId,
            status: 'ready_to_mint'
          });
        } catch (updateError) {
          console.error('Error al actualizar metadatos de sesión:', updateError);
          return res.status(500).json({ error: 'Error al actualizar la sesión' });
        }
      } else {
        console.log('Evento de checkout completado pero no es NFT:', metadata.type);
        return res.status(200).json({ received: true, status: 'not_nft' });
      }
    } else {
      // Para otros tipos de eventos, simplemente confirmar recepción
      console.log('Evento recibido pero no procesado:', event.type);
      return res.status(200).json({ received: true });
    }
  } catch (err) {
    console.error('Error procesando el evento:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}; 