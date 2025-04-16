// ENDPOINT DE EMERGENCIA PARA WEBHOOKS DE NFT
const Stripe = require('stripe');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios'); // Asegúrate de instalar axios: npm install axios

// Cargar variables de entorno
dotenv.config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Función para mintear un NFT (simulada)
async function mintNFT(nftId, customerEmail, metadataCID, sessionId) {
  console.log(`🔥 Iniciando minteo del NFT: ${nftId} para ${customerEmail}`);
  console.log(`📦 Metadata CID: ${metadataCID}`);
  
  try {
    // Aquí iría la lógica real de minteo con web3/ethers
    // Por ahora simularemos que el minteo fue exitoso
    const txHash = `0x${Math.random().toString(16).substring(2)}`;
    
    console.log(`✅ NFT minteado con éxito. Hash: ${txHash}`);
    
    // Actualizar los metadatos en Stripe para reflejar que ya se minteó
    await stripe.checkout.sessions.update(
      sessionId,
      {
        metadata: {
          minted: 'true',
          mintedAt: new Date().toISOString(),
          txHash: txHash
        }
      }
    );
    
    console.log(`✅ Metadatos actualizados en Stripe para la sesión: ${sessionId}`);
    
    // Aquí se podría enviar un email al cliente notificando que su NFT está listo
    return {
      success: true,
      txHash: txHash
    };
  } catch (error) {
    console.error('❌ Error al mintear NFT:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Endpoint principal
module.exports = async (req, res) => {
  // Configuración CORS mejorada
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature, Authorization');
  
  // Responder a solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`🔔 Webhook de NFT de emergencia recibido: ${new Date().toISOString()}`);
  
  // Obtener el cuerpo de la solicitud como string
  let event;
  
  // Verificar que tenemos un body
  if (!req.body) {
    console.error('❌ No se recibió cuerpo en la solicitud');
    return res.status(400).json({ error: 'No se recibió cuerpo en la solicitud' });
  }
  
  try {
    // Usamos directamente el body parseado
    event = req.body;
    console.log(`📝 Tipo de evento: ${event.type}`);
    
    // Verificar que sea un evento de checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      console.log(`⏭️ Ignorando evento de tipo: ${event.type}`);
      return res.status(200).json({ received: true, ignored: true, reason: 'Tipo de evento no relevante' });
    }
    
    const session = event.data.object;
    console.log(`✅ Checkout completado para la sesión: ${session.id}`);
    
    // Verificar si es una sesión de NFT
    if (!session.metadata || session.metadata.type !== 'lazy_mint') {
      console.log('⏭️ No es un NFT, es un producto regular');
      return res.status(200).json({ 
        received: true, 
        processed: false, 
        reason: 'No es un NFT'
      });
    }
    
    console.log('🎭 Es un NFT con lazy minting!');
    console.log('Metadatos:', JSON.stringify(session.metadata));
    
    // Extraer información relevante del NFT
    const nftId = session.metadata.nftId || session.metadata.lazyId;
    const customerEmail = session.customer_details?.email;
    const metadataCID = session.metadata.metadataCID;
    
    if (!nftId || !customerEmail) {
      console.error('❌ Falta información esencial del NFT');
      return res.status(200).json({ 
        received: true, 
        processed: false, 
        error: 'Información incompleta para el minteo del NFT' 
      });
    }
    
    // Verificar si ya fue minteado
    if (session.metadata.minted === 'true') {
      console.log(`⏭️ NFT ${nftId} ya fue minteado previamente`);
      return res.status(200).json({
        received: true,
        processed: false,
        reason: 'NFT ya minteado previamente',
        nftId: nftId
      });
    }
    
    // Procesar el minteo del NFT
    const mintResult = await mintNFT(nftId, customerEmail, metadataCID, session.id);
    
    if (mintResult.success) {
      console.log(`✅ NFT procesado correctamente: ${nftId}`);
      return res.status(200).json({
        received: true,
        processed: true,
        nftId: nftId,
        txHash: mintResult.txHash
      });
    } else {
      console.error(`❌ Error al procesar NFT: ${mintResult.error}`);
      // Respondemos 200 para que Stripe no reintente, pero registramos el error
      return res.status(200).json({
        received: true,
        processed: false,
        error: mintResult.error,
        nftId: nftId
      });
    }
    
  } catch (error) {
    console.error('❌ Error al procesar webhook:', error);
    // Devolvemos 200 para que Stripe no reintente, pero registramos el error
    return res.status(200).json({ 
      received: true, 
      processed: false, 
      error: error.message,
      debug: {
        eventType: event?.type,
        hasSession: !!event?.data?.object,
        hasMetadata: !!event?.data?.object?.metadata,
        metadata: event?.data?.object?.metadata || {}
      }
    });
  }
}; 