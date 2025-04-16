// Webhook para manejar eventos de Stripe NFT
const Stripe = require('stripe');
require('dotenv').config();
const ethers = require('ethers');
const mongoose = require('mongoose');
const { exec } = require('child_process'); // Módulo nativo para ejecutar comandos

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
        
        // Obtener información para el minteo
        const lazyId = metadata.nftId || metadata.lazyId || null;
        const walletAddress = metadata.walletAddress;
        const metadataUrl = metadata.metadataUrl;
        
        if (!lazyId || !walletAddress) {
          console.error('Datos insuficientes para el minteo:', metadata);
          return res.status(400).json({ error: 'Metadatos de NFT incompletos para minteo' });
        }
        
        try {
          console.log(`🚀 Agregando NFT a la cola de minteo: ${lazyId} para wallet ${walletAddress}`);
          
          // Añadir a la cola de minteo en MongoDB
          const queueResult = await addToMintQueue({
            sessionId: session.id,
            lazyId,
            walletAddress,
            metadataUrl,
            customerEmail: session.customer_email,
            createdAt: new Date(),
            status: 'pending'
          });
          
          // Actualizar los metadatos de la sesión con el resultado
          await stripe.checkout.sessions.update(session.id, {
            metadata: {
              ...metadata,
              nft_status: 'queued',
              processed_at: new Date().toISOString(),
              mint_queue_id: queueResult.queueId
            }
          });
          
          console.log(`✅ NFT ${lazyId} agregado a la cola de minteo, ID: ${queueResult.queueId}`);
          
          // Ejecutar exactamente el mismo curl que funciona en la consola
          console.log('🔄 Iniciando procesamiento inmediato con curl...');
          exec('curl https://nani-boronat.vercel.app/api/cron-mint-processor', (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Error al ejecutar curl: ${error.message}`);
              return;
            }
            if (stderr) {
              console.error(`⚠️ Advertencia curl: ${stderr}`);
            }
            console.log(`✅ Respuesta del cron job: ${stdout}`);
          });
          
          return res.status(200).json({
            received: true,
            nftId: lazyId,
            status: 'queued',
            queueId: queueResult.queueId
          });
          
        } catch (queueError) {
          console.error('Error al encolar el minteo:', queueError);
          return res.status(500).json({ error: 'Error al encolar el minteo' });
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

// Función para añadir un NFT a la cola de minteo
async function addToMintQueue(data) {
  try {
    // Comprobar si MongoDB está configurado
    if (!process.env.MONGO_URI) {
      console.log('⚠️ No hay MONGO_URI configurado, simulando cola sin base de datos');
      return { 
        success: true, 
        queueId: 'fake-queue-id-' + Date.now(),
        message: 'Cola simulada (sin MongoDB)' 
      };
    }

    // Conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Intentando conectar a MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Conexión a MongoDB establecida');
    }
    
    // Esquema para la cola de minteo
    const mintQueueSchema = new mongoose.Schema({
      sessionId: String,
      lazyId: String,
      walletAddress: String,
      metadataUrl: String,
      customerEmail: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed'], 
        default: 'pending' 
      },
      attempts: { type: Number, default: 0 },
      txHash: String,
      error: String
    });
    
    // Modelo
    const MintQueue = mongoose.models.MintQueue || 
      mongoose.model('MintQueue', mintQueueSchema, 'mint_queue');
    
    // Guardar registro
    const queueItem = new MintQueue(data);
    await queueItem.save();
    
    console.log(`📝 NFT agregado a la cola de minteo: ${data.lazyId}`);
    
    return {
      success: true,
      queueId: queueItem._id.toString()
    };
    
  } catch (error) {
    console.error('❌ Error al agregar a la cola de minteo:', error.message);
    throw error;
  }
} 