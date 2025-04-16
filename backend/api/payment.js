const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const mongoose = require('mongoose');

// Inicializar Stripe una sola vez
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Endpoint de prueba
router.get('/api/payment', (req, res) => {
  res.send({
    message: 'Ping desde Checkout Server',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Iniciar checkout
router.post('/api/payment/session-initiate', async (req, res) => {
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
    const finalSuccessUrl = successUrl || 'https://naniboron.web.app/success?session_id={CHECKOUT_SESSION_ID}';
    const finalCancelUrl = cancelUrl || 'https://naniboron.web.app/tienda-online';
    
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
        : 'https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png'
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

module.exports = router; 