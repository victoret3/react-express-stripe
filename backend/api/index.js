const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Configuración inicial
const app = express();

// Middleware general de CORS
app.use(cors({
  origin: 'https://naniboron.web.app',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature'],
  credentials: true
}));

// Middleware específico para webhooks de Stripe
app.use((req, res, next) => {
  if (
    req.originalUrl === '/api/payment/webhook' || 
    req.originalUrl === '/api/payment/nft-webhook' ||
    req.originalUrl === '/api/nft-webhook' ||
    req.originalUrl === '/api/webhook'
  ) {
    // Para rutas de webhook, usar raw body para verificación de firma
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Para otras rutas, usar el parser de JSON estándar
    express.json()(req, res, next);
  }
});

// Importar webhook router
const webhookRouter = require('./webhook');
const simpleWebhookRouter = require('./simple-webhook');
const debugRouter = require('./debug');
const nftCheckoutRouter = require('./nft-checkout');

// Rutas de webhook - IMPORTANTE: debe estar antes del middleware JSON
app.use('/api/webhook', webhookRouter);
app.use('/api/simple-webhook', simpleWebhookRouter);
app.use('/api/debug', debugRouter);
app.use('/api/nft-checkout', nftCheckoutRouter);

try {
  // Importar rutas - primero intentamos desde Vercel, si falla, usamos las rutas originales
  let paymentRoutes;
  let nftRoutes;

  try {
    // Intento 1: Importar desde el directorio api/ (estructura Vercel)
    paymentRoutes = require('./payment');
    nftRoutes = require('./nft');
    // Si llegamos aquí, estamos en estructura Vercel
    console.log('Usando estructura Vercel para rutas');
  } catch (e) {
    // Intento 2: Importar desde estructura original
    console.log('Fallback a estructura original para rutas:', e.message);
    paymentRoutes = require('../src/routes/payment');
    nftRoutes = require('../src/routes/nft');
  }

  // Conectar a MongoDB (solo si hay URI configurada)
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ Conexión a MongoDB establecida'))
      .catch(err => console.error('❌ Error conectando a MongoDB:', err));
  } else {
    console.warn('⚠️ Variable MONGO_URI no configurada');
  }

  // Configurar rutas disponibles
  if (paymentRoutes) app.use(paymentRoutes);
  if (nftRoutes) app.use(nftRoutes);
  
  // Ruta de verificación
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      modulesLoaded: {
        payment: !!paymentRoutes,
        nft: !!nftRoutes,
        webhook: true
      }
    });
  });

  // Agregar la ruta de productos directamente aquí en vez de cargarla desde otro archivo
  app.get('/api/products', async (req, res) => {
    // Configurar CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Responder a OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    console.log('⚠️ Estado de MONGO_URI:', process.env.MONGO_URI ? 'Definido' : 'Indefinido');
    console.log('Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    
    try {
      // Definir el schema para el producto
      const productSchema = new mongoose.Schema({
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        image: { type: String },
        stock: { type: Number, default: 0 }
      });

      // Crear el modelo
      const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');
      
      // Verificar la conexión a MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log('No hay conexión a MongoDB. Intentando conectar...');
        
        if (!process.env.MONGO_URI) {
          throw new Error('MONGO_URI no está definido en las variables de entorno');
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conexión a MongoDB establecida');
      }
      
      console.log('Buscando productos en la colección:', mongoose.connection.db?.databaseName);
      
      // Obtener productos
      const products = await Product.find({});
      console.log(`Se encontraron ${products.length} productos en la base de datos`);
      
      // Devolver los productos
      return res.json(products);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      // Devolver un mensaje de error visible
      return res.json([
        {
          _id: "error-1",
          name: "Error de Conexión a MongoDB",
          price: 0,
          description: `Error: ${error.message}`,
          image: "https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png",
          stock: 0
        }
      ]);
    }
  });

  // Endpoint para status
  app.get('/api/products/status', (req, res) => {
    res.json({
      status: 'ok',
      mongodbUri: process.env.MONGO_URI ? 'definido' : 'no definido',
      mongoConnection: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
      mongoState: mongoose.connection.readyState,
      env: Object.keys(process.env).filter(key => key.includes('MONGO'))
    });
  });

  // Añadir el endpoint de inciación de sesión de pago 
  app.post('/api/payment/session-initiate', async (req, res) => {
    // Configuración CORS específica para esta ruta - usar origen específico
    res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
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

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
  app.post('/api/payment/lazy-mint', async (req, res) => {
    // Configuración CORS específica para esta ruta - usar origen específico
    res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Si es una solicitud OPTIONS preflight, responder con 200
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const { lazyId, email, metadataUrl } = req.body;
    
    if (!lazyId || !email) {
      return res.status(400).json({ error: 'Se requiere lazyId y email para la compra' });
    }
    
    try {
      console.log(`Iniciando compra de NFT lazy mint. ID: ${lazyId}, Email: ${email}`);
      
      // Precio fijo para los NFTs
      const priceEur = 20; // 20 euros precio fijo
      
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
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
            },
            unit_amount: priceEur * 100, // Convertir a céntimos
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://naniboron.web.app'}/nft-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://naniboron.web.app'}/lazy-mint`,
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

  // Endpoint específico para webhooks de NFT
  app.post('/api/payment/nft-webhook', async (req, res) => {
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
          // Aquí iría la lógica para mintear el NFT o marcarlo como pendiente de minteo
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

} catch (error) {
  console.error('Error en la inicialización:', error);
}

// Exportar la instancia de la aplicación para Vercel
module.exports = app;