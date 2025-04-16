// Webhook seguro con autenticación por token personalizado
const Stripe = require('stripe');
const crypto = require('crypto');

// Función principal
module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-token, stripe-signature');
  
  // Responder inmediatamente a las solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar que es una solicitud POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  console.log('📡 Secure Webhook: Solicitud recibida');
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Verificar el token personalizado
  const webhookToken = req.headers['x-webhook-token'];
  const expectedToken = process.env.CUSTOM_WEBHOOK_TOKEN || 'nft-webhook-secret-token';
  
  if (!webhookToken) {
    console.log('❌ Token de autenticación no proporcionado');
    return res.status(401).json({ error: 'Falta token de autenticación' });
  }
  
  if (webhookToken !== expectedToken) {
    console.log('❌ Token de autenticación inválido');
    // Usar comparación de tiempo constante para prevenir timing attacks
    const valid = crypto.timingSafeEqual(
      Buffer.from(webhookToken),
      Buffer.from(expectedToken)
    );
    
    if (!valid) {
      return res.status(403).json({ error: 'Token de autenticación inválido' });
    }
  }
  
  console.log('✅ Token verificado correctamente');
  
  try {
    // Obtener el cuerpo de la solicitud
    let eventData;
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString('utf8');
      console.log('Body tipo buffer, convirtiendo a JSON...');
      try {
        eventData = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error('Error parseando JSON:', parseErr.message);
        return res.status(400).json({ error: 'Cuerpo no es JSON válido' });
      }
    } else if (typeof req.body === 'object') {
      eventData = req.body;
    } else {
      console.error('Formato inesperado del cuerpo:', typeof req.body);
      return res.status(400).json({ error: 'Formato de cuerpo inesperado' });
    }
    
    // Inicializar Stripe (solo para usar sus modelos)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Procesar el evento
    if (!eventData || !eventData.type || !eventData.data || !eventData.data.object) {
      console.error('Estructura de evento inválida');
      return res.status(400).json({ error: 'Evento no tiene la estructura esperada' });
    }
    
    console.log(`📥 Evento recibido: ${eventData.type}`);
    console.log(`ID de evento: ${eventData.id}`);
    
    // Para sesiones de checkout completadas
    if (eventData.type === 'checkout.session.completed') {
      const session = eventData.data.object;
      console.log(`💰 Sesión de checkout completada: ${session.id}`);
      console.log(`Metadatos: ${JSON.stringify(session.metadata || {})}`);
      
      // Verificar si es una sesión de NFT
      if (session.metadata && session.metadata.type === 'lazy_mint') {
        const nftId = session.metadata.nftId || session.metadata.lazyId;
        const metadataCID = session.metadata.metadataCID;
        const customerEmail = session.customer_email;
        
        console.log('🎯 NFT a mintear detectado:');
        console.log(`- ID: ${nftId || 'No disponible'}`);
        console.log(`- CID: ${metadataCID || 'No disponible'}`);
        console.log(`- Email: ${customerEmail || 'No disponible'}`);
        
        // Aquí iría la lógica para mintear el NFT
        // Por ejemplo:
        // 1. Invocar un servicio externo
        // 2. Actualizar una base de datos
        // 3. Enviar un email de confirmación
        
        // Para este ejemplo, solo registramos que lo procesamos
        console.log('✨ NFT procesado correctamente');
      } else {
        console.log('📦 Sesión estándar de producto (no es NFT)');
      }
      
      // Obtener los items si es necesario
      try {
        // Esto es opcional, pero útil para debugging
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        console.log(`Productos comprados: ${lineItems.data.length}`);
      } catch (itemsErr) {
        console.log('Error al obtener items:', itemsErr.message);
      }
    }
    
    // Responder exitosamente
    return res.status(200).json({
      received: true,
      type: eventData.type,
      processed: true
    });
    
  } catch (err) {
    console.error('Error general:', err.message);
    return res.status(500).json({ error: err.message });
  }
}; 