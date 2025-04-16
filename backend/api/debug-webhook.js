// Webhook de depuración que no verifica la firma
const Stripe = require('stripe');

// Función principal
module.exports = async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  
  // Responder inmediatamente a las solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar que es una solicitud POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Información de depuración
    console.log('🔍 DEBUG WEBHOOK RECIBIDO');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Tipo de body:', typeof req.body);
    console.log('¿Es buffer?:', Buffer.isBuffer(req.body));
    
    // Si es un buffer, convertirlo a JSON para procesarlo
    let eventData;
    if (Buffer.isBuffer(req.body)) {
      const rawBody = req.body.toString('utf8');
      console.log('Raw body (primeros 100 caracteres):', rawBody.substring(0, 100) + '...');
      try {
        eventData = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error('Error parseando JSON del body:', parseErr.message);
        return res.status(400).json({ error: 'No se pudo parsear el cuerpo como JSON' });
      }
    } else if (typeof req.body === 'object') {
      eventData = req.body;
    } else {
      return res.status(400).json({ error: 'Formato de cuerpo inesperado' });
    }
    
    // Si tiene la estructura esperada de un evento de Stripe
    if (eventData && eventData.type && eventData.data && eventData.data.object) {
      console.log('Tipo de evento recibido:', eventData.type);
      
      if (eventData.type === 'checkout.session.completed') {
        const session = eventData.data.object;
        
        console.log('ID de sesión:', session.id);
        console.log('Metadatos recibidos:', JSON.stringify(session.metadata));
        
        // Verificar si es una sesión de NFT
        if (session.metadata && session.metadata.type === 'lazy_mint') {
          // Extraer información relevante
          const nftId = session.metadata.nftId || session.metadata.lazyId;
          const metadataCID = session.metadata.metadataCID;
          const customerEmail = session.customer_email;
          
          console.log(`✅ Sesión NFT detectada y procesada:`);
          console.log(`- NFT ID: ${nftId || 'No disponible'}`);
          console.log(`- Metadata CID: ${metadataCID || 'No disponible'}`);
          console.log(`- Email: ${customerEmail || 'No disponible'}`);
          
          // Aquí iría la lógica de procesamiento real del NFT
        } else {
          console.log('❌ No es una sesión de NFT (falta type=lazy_mint en metadata)');
        }
      }
      
      // Responder con éxito
      return res.status(200).json({ 
        received: true, 
        type: eventData.type,
        debug: true
      });
    } else {
      console.log('❌ Estructura de evento no reconocida');
      return res.status(400).json({ error: 'Estructura de evento no reconocida' });
    }
  } catch (err) {
    console.error('Error general en debug-webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}; 