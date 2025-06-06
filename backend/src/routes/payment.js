const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Inicializar Stripe una sola vez
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Función de emergencia que conecta directamente a MongoDB para actualizar el stock
async function updateStockDirectly(productId, quantity) {
  try {
    console.log(`🔥 EMERGENCIA: Intentando actualizar stock directamente para productId=${productId}, cantidad=${quantity}`);
    
    // Asegurarnos de tener una conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('Conectando a MongoDB directamente...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Conexión a MongoDB establecida');
    }
    
    // Actualizar directamente sin usar el modelo
    const result = await mongoose.connection.db.collection('products')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(productId) },
        { $inc: { stock: -quantity } }
      );
      
    console.log('Resultado de actualización directa:', JSON.stringify(result, null, 2));
    
    if (result.modifiedCount === 1) {
      console.log(`✅✅✅ ÉXITO: Stock actualizado directamente para producto ${productId}`);
      return true;
    } else {
      console.error(`❌❌❌ ERROR: No se pudo actualizar el stock directamente para ${productId}`);
      return false;
    }
  } catch (error) {
    console.error('Error en actualización directa:', error);
    return false;
  }
}

// Endpoint de prueba
router.get('/api/payment', (req, res) => {
  res.send({
    message: 'Ping desde Checkout Server',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Endpoint principal de webhook
router.post('/api/payment/webhook', async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

  // Responder a solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('⚡️ Recibido webhook principal de Stripe');
  
  // Verificar la presencia del encabezado stripe-signature
  const sig = req.headers['stripe-signature'];
  console.log('¿Tiene encabezado stripe-signature?', !!sig);
  console.log('¿Tiene STRIPE_WEBHOOK_SECRET?', !!process.env.STRIPE_WEBHOOK_SECRET);
  
  // Verificar que el cuerpo sea un Buffer
  console.log('Tipo de req.body:', typeof req.body);
  console.log('¿Es req.body un buffer?', Buffer.isBuffer(req.body));
  
  if (!sig) {
    console.log('Error: No se encontró el encabezado de firma de webhook');
    return res.status(400).send('⚠️ Falta el encabezado de firma de webhook');
  }

  let event;

  try {
    // Construir el evento con el cuerpo raw y la firma
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Evento construido correctamente:', event.type);
  } catch (err) {
    console.error(`⚠️ Error de verificación de webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento según su tipo
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Sesión de pago completada: ${session.id}`);
    
    // Verificar el tipo de sesión en los metadatos
    if (session.metadata && session.metadata.type === 'lazy_mint') {
      console.log('Esta es una sesión de NFT, redirigiendo al webhook de NFT');
      // Esta sesión debe ser manejada por el webhook de NFT
      return res.status(200).send('OK - Redirect to NFT webhook');
    }

    try {
      // Obtener los line_items de la sesión completada
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      console.log(`📦 Items comprados: ${lineItems.data.length}`);

      // Verificar conexión a MongoDB antes de actualizar stock
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.log('⚠️ No hay conexión a MongoDB. Intentando conectar...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión a MongoDB establecida');
      }

      // Actualizar stock para cada item comprado
      for (const item of lineItems.data) {
        const productId = item.price.product;
        const quantity = item.quantity;

        console.log(`Actualizando stock para producto ${productId}, cantidad: ${quantity}`);
        
        try {
          // Buscar el producto en MongoDB por su ID de Stripe
          const product = await Product.findOne({ stripeProductId: productId });
          
          if (!product) {
            console.log(`⚠️ Producto no encontrado: ${productId}`);
            continue;
          }
          
          // Calcular nuevo stock y actualizar
          const originalStock = product.stock;
          const newStock = Math.max(0, originalStock - quantity);
          
          product.stock = newStock;
          await product.save();
          
          console.log(`✅ Stock actualizado para ${product.name}: ${originalStock} → ${newStock}`);
        } catch (error) {
          console.error(`❌ Error al actualizar stock para ${productId}:`, error);
        }
      }

      console.log('✅ Proceso de actualización de stock completado');
    } catch (error) {
      console.error('❌ Error al procesar la sesión completada:', error);
    }
  }

  // Responder a Stripe con un 200 OK
  res.status(200).send('OK');
});

// Endpoint específico para webhooks de NFT
router.post('/api/payment/nft-webhook', async (req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

  // Responder a solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('⚡️ Recibido webhook NFT de Stripe');
  
  // Verificar la presencia del encabezado stripe-signature
  const sig = req.headers['stripe-signature'];
  console.log('¿Tiene encabezado stripe-signature?', !!sig);
  console.log('¿Tiene STRIPE_WEBHOOK_SECRET?', !!process.env.STRIPE_WEBHOOK_SECRET);
  
  // Verificar que el cuerpo sea un Buffer
  console.log('Tipo de req.body:', typeof req.body);
  console.log('¿Es req.body un buffer?', Buffer.isBuffer(req.body));
  
  if (!sig) {
    console.log('Error: No se encontró el encabezado stripe-signature');
    return res.status(400).send('⚠️ Falta el encabezado de firma de webhook');
  }

  let event;

  try {
    // Construir el evento con el cuerpo raw y la firma
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Evento NFT construido correctamente:', event.type);
  } catch (err) {
    console.error(`⚠️ Error de verificación de webhook NFT: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento según su tipo
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`💰 Sesión de pago NFT completada: ${session.id}`);
    
    // Verificar si esta es una sesión para lazy_mint
    if (session.metadata && session.metadata.type === 'lazy_mint') {
      console.log('✅ Sesión identificada como lazy_mint');
      const lazyId = session.metadata.lazyId;
      
      if (lazyId) {
        console.log(`🪙 Lazy mint ID: ${lazyId}`);
        // Aquí iría la lógica para mintear el NFT
        // Por ahora solo registramos que recibimos el webhook correctamente
        console.log('🔄 Proceso de minteo iniciado para lazyId:', lazyId);
      } else {
        console.log('⚠️ No se encontró lazyId en los metadatos');
      }
    } else {
      console.log('⚠️ Esta sesión no es para lazy_mint o falta información en los metadatos');
    }
  }

  // Responder a Stripe con un 200 OK
  res.status(200).send('OK');
});

// Iniciar checkout
router.post('/session-initiate', async (req, res) => {
  // Configuración CORS específica para esta ruta
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
  
  // Si es una solicitud OPTIONS preflight, responder con 200
  if (req.method === 'OPTIONS') {
    console.log('Recibida solicitud OPTIONS preflight para session-initiate');
    return res.status(200).end();
  }
  
  try {
    const { lineItems, successUrl, cancelUrl, name, email, metadata } = req.body;
    
    // Log para depuración
    console.log('Cuerpo de la solicitud completo:', JSON.stringify(req.body, null, 2));
    
    // Verificar que tenemos STRIPE_SECRET_KEY configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('ERROR: STRIPE_SECRET_KEY no está configurado');
      return res.status(500).json({ error: 'Configuración de Stripe incompleta' });
    }
    
    // Verificar que tenemos los datos necesarios
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      console.error('ERROR: lineItems no proporcionado o inválido', lineItems);
      return res.status(400).json({ error: 'Se requiere al menos un item para crear la sesión' });
    }
  
    console.log('Line items from client:', JSON.stringify(lineItems, null, 2));
    console.log('Metadatos recibidos:', metadata);
    
    // Asegurarnos de que las URLs de redirección sean correctas
    console.log('URLs de redirección originales:', { successUrl, cancelUrl });
    
    // Si no se proporcionan URLs o son incorrectas, usar valores por defecto
    const finalSuccessUrl = successUrl || 'https://naniboronat.com/success?session_id={CHECKOUT_SESSION_ID}';
    const finalCancelUrl = cancelUrl || 'https://naniboronat.com/tienda-online';
    
    console.log('URLs de redirección finales:', { finalSuccessUrl, finalCancelUrl });

    // Crear objeto de sesión con parámetros básicos
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES', 'AD', 'FR'],
      },
      phone_number_collection: { enabled: true },
      metadata: { 
        name,
        // Usar los metadatos pasados o por defecto 'product'
        ...metadata || { type: 'product' }
      },
    };
    
    // Crear la sesión
    console.log('Creando sesión de Stripe con config:', JSON.stringify(sessionConfig, null, 2));
    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log('Sesión creada:', session.id);

    // Devolver la respuesta como JSON
    return res.status(200).json(session);
  } catch (error) {
    console.error('Error creando la sesión de Stripe:', error);
    // Asegurarnos de devolver un error en formato JSON
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Endpoint específico para compra de NFTs con lazy minting
router.post('/lazy-mint', async (req, res) => {
  // Configuración CORS específica para esta ruta
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Si es una solicitud OPTIONS preflight, responder con 200
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lazyId, email, metadataUrl } = req.body;

  if (!lazyId || !email) {
    return res.status(400).json({ error: 'Se requiere lazyId y email para la compra' });
  }

  try {
    // Precio fijo para los NFTs
    const priceEur = 20; // 20 euros precio fijo

    // Crear una sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `NFT Nani Boronat (#${lazyId})`,
            description: 'NFT Exclusivo de Nani Boronat - Edición Limitada',
            images: ['https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png'], // imagen genérica
            metadata: { lazyId }
          },
          unit_amount: priceEur * 100, // 20€ en céntimos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/nft-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/comunidad`,
      customer_email: email,
      metadata: {
        lazyId,
        metadataUrl,
        type: 'lazy_mint',
        useFixedPrice: 'true'
      }
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creando la sesión de Stripe para lazy mint:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener detalles de un pedido
router.get('/api/payment/order/:sessionId', async (req, res) => {
  // Configuración CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Se requiere ID de sesión' });
  }
  
  try {
    console.log(`Obteniendo información del pedido para sesión: ${sessionId}`);
    
    // Obtener sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Obtener line items
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      expand: ['data.price.product'],
    });
    
    // Crear objeto de respuesta
    const orderItems = lineItems.data.map(item => ({
      id: item.id,
      name: item.description || item.price.product.name,
      price: item.amount_total / 100, // Convertir de centavos a euros
      quantity: item.quantity,
      image: item.price.product.images && item.price.product.images.length > 0 
        ? item.price.product.images[0] 
        : 'https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png',
      // Añadir el productId de MongoDB si está disponible en los metadatos
      mongoProductId: item.price?.product?.metadata?.productId || null
    }));
    
    const orderInfo = {
      orderNumber: sessionId.substring(sessionId.length - 8).toUpperCase(),
      email: session.customer_email || 'cliente@ejemplo.com',
      totalAmount: session.amount_total / 100, // Convertir de centavos a euros
      items: orderItems,
      createdAt: new Date(session.created * 1000).toISOString(),
      shippingAddress: session.shipping 
        ? {
            name: session.shipping.name,
            address: session.shipping.address.line1,
            city: session.shipping.address.city,
            postalCode: session.shipping.address.postal_code,
            country: session.shipping.address.country
          }
        : null
    };
    
    return res.status(200).json({ order: orderInfo });
  } catch (error) {
    console.error(`Error obteniendo detalles del pedido: ${error.message}`);
    return res.status(500).json({ 
      error: 'No se pudo verificar la información del pedido',
      details: error.message
    });
  }
});

// ENDPOINT DE EMERGENCIA para webhooks Stripe
router.post('/api/payment/emergency-webhook', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('🚨 WEBHOOK DE EMERGENCIA RECIBIDO');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // No verificamos la firma en este endpoint de emergencia
    const event = req.body;
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Checkout completado:', session.id);
      
      // Obtener line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
      
      console.log('Items comprados:', JSON.stringify(lineItems.data.map(item => ({
        description: item.description,
        productId: item.price?.product?.metadata?.productId
      }))));
      
      // Actualizar stock directamente
      let stockActualizado = false;
      for (const item of lineItems.data) {
        const productId = item.price?.product?.metadata?.productId;
        if (productId) {
          try {
            // Conectar a MongoDB directamente
            if (mongoose.connection.readyState !== 1) {
              await mongoose.connect(process.env.MONGO_URI);
            }
            
            // Actualizar el stock en MongoDB
            const result = await mongoose.connection.db.collection('products')
              .updateOne(
                { _id: new mongoose.Types.ObjectId(productId) },
                { $inc: { stock: -item.quantity } }
              );
            
            if (result.modifiedCount === 1) {
              console.log(`✅ Stock actualizado para producto ${productId}`);
              stockActualizado = true;
            }
          } catch (error) {
            console.error('Error actualizando stock:', error);
          }
        }
      }
      
      return res.status(200).json({
        received: true,
        stockActualizado
      });
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook de emergencia:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;