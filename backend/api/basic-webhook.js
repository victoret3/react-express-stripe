// Webhook básico para Stripe sin ningún middleware
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

  // Log de encabezados para debug
  console.log('Headers recibidos:', JSON.stringify(req.headers));
  console.log('Tipo de cuerpo:', typeof req.body);
  console.log('¿Es buffer?:', Buffer.isBuffer(req.body));
  
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Falta encabezado stripe-signature' });
  }

  // Inicializar Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    // Intentar construir el evento
    console.log('Intentando construir evento...');
    console.log('Secret config:', webhookSecret ? 'Presente' : 'Ausente');
    console.log('Firma:', signature.substring(0, 20) + '...');
    
    // Para debug: guardar valores clave
    const bodyLength = req.body ? (Buffer.isBuffer(req.body) ? req.body.length : JSON.stringify(req.body).length) : 0;
    console.log('Longitud del cuerpo:', bodyLength);
    
    // Convertir el cuerpo a string para verificar contenido sin exponer datos sensibles
    if (Buffer.isBuffer(req.body)) {
      const bodyPreview = req.body.slice(0, 100).toString('utf8');
      console.log('Vista previa del cuerpo (100 bytes):', bodyPreview.replace(/\n/g, '\\n'));
    }
    
    // Construir el evento con manejo de errores detallado
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Error construyendo evento:', err.message);
      // Verificar errores específicos para dar mejores pistas
      if (err.message.includes('No signatures found')) {
        console.error('Problema con la firma. Posiblemente el cuerpo se modificó o el secreto es incorrecto.');
      } else if (err.message.includes('timestamp')) {
        console.error('Problema con el timestamp de la firma. Verifica la sincronización horaria.');
      }
      
      return res.status(400).json({ 
        error: err.message,
        tip: 'Asegúrate de que el secreto del webhook es correcto y estás enviando el cuerpo crudo'
      });
    }
    
    // Procesar el evento
    console.log('✅ Evento construido correctamente:', event.type);
    const session = event.data.object;
    
    // Verificar metadatos para NFT
    if (event.type === 'checkout.session.completed' && 
        session.metadata && 
        session.metadata.type === 'lazy_mint') {
      
      console.log('💎 Sesión NFT completada:', session.id);
      console.log('Metadatos:', JSON.stringify(session.metadata));
      
      // Datos relevantes para NFT
      const nftId = session.metadata.nftId || session.metadata.lazyId;
      if (nftId) {
        console.log(`NFT ID: ${nftId}`);
        // Aquí iría la lógica de minteo
      }
    }
    
    // Responder con éxito
    return res.status(200).json({ 
      received: true,
      type: event.type,
      id: event.id
    });
    
  } catch (err) {
    // Error general
    console.error('Error general:', err.message);
    return res.status(500).json({ error: err.message });
  }
}; 