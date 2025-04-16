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
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature']
}));

// Middleware específico para webhooks de Stripe
app.use((req, res, next) => {
  if (
    req.originalUrl === '/api/payment/webhook' || 
    req.originalUrl === '/api/payment/nft-webhook' ||
    req.originalUrl === '/api/nft-webhook' ||
    req.originalUrl === '/api/emergency-nft-webhook' ||
    req.originalUrl.includes('webhook')
  ) {
    // Para rutas de webhook, usar raw body para verificación de firma
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Para otras rutas, usar el parser de JSON estándar
    express.json()(req, res, next);
  }
});

try {
  // Importar rutas - primero intentamos desde Vercel, si falla, usamos las rutas originales
  let paymentRoutes;
  let productRoutes;
  let nftRoutes;
  let directMintRouter;
  let nftCheckoutRouter;
  let nftWebhookHandler;
  let emergencyNftWebhookHandler;
  let mintProcessorRouter;
  let cronMintProcessorRouter;

  try {
    // Intento 1: Importar desde el directorio api/ (estructura Vercel)
    paymentRoutes = require('./payment');
    productRoutes = require('./product');
    nftRoutes = require('./nft');
    directMintRouter = require('./direct-mint');
    nftCheckoutRouter = require('./nft-checkout');
    nftWebhookHandler = require('./nft-webhook');
    emergencyNftWebhookHandler = require('./emergency-nft-webhook');
    mintProcessorRouter = require('./mint-processor');
    cronMintProcessorRouter = require('./cron-mint-processor');
    // Si llegamos aquí, estamos en estructura Vercel
    console.log('Usando estructura Vercel para rutas');
  } catch (e) {
    // Intento 2: Importar desde estructura original
    console.log('Fallback a estructura original para rutas:', e.message);
    paymentRoutes = require('../src/routes/payment');
    productRoutes = require('../src/routes/product');
    nftRoutes = require('../src/routes/nft');
    directMintRouter = require('../src/routes/direct-mint');
    nftCheckoutRouter = require('../src/routes/nft-checkout');
    nftWebhookHandler = require('../src/routes/nft-webhook');
    emergencyNftWebhookHandler = require('../src/routes/emergency-nft-webhook');
    mintProcessorRouter = require('../src/routes/mint-processor');
    cronMintProcessorRouter = require('../src/routes/cron-mint-processor');
  }

  // Conectar a MongoDB usando la variable de entorno
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ Conectado a MongoDB con MONGO_URI'))
      .catch(err => console.error('❌ Error conectando a MongoDB:', err));
  } else {
    console.log('⚠️ No se encontró MONGO_URI en las variables de entorno');
  }

  // Configurar rutas disponibles
  if (paymentRoutes) app.use('/api/payment', paymentRoutes);
  if (productRoutes) app.use('/api/product', productRoutes);
  if (nftRoutes) app.use('/api/nft', nftRoutes);
  if (directMintRouter) app.use('/api/direct-mint', directMintRouter);
  if (nftCheckoutRouter) app.use('/api/nft-checkout', nftCheckoutRouter);
  
  // Configurar webhooks
  if (nftWebhookHandler) app.post('/api/nft-webhook', nftWebhookHandler);
  if (emergencyNftWebhookHandler) app.post('/api/emergency-nft-webhook', emergencyNftWebhookHandler);
  
  // Configurar procesador de minteo en cola
  if (mintProcessorRouter) app.use('/api/mint-processor', mintProcessorRouter);
  
  // Configurar cron job de procesamiento de cola
  if (cronMintProcessorRouter) app.use('/api/cron-mint-processor', cronMintProcessorRouter);
  
  // Ruta de verificación
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      modulesLoaded: {
        payment: !!paymentRoutes,
        product: !!productRoutes,
        nft: !!nftRoutes
      }
    });
  });

} catch (error) {
  console.error('Error en la inicialización:', error);
}

// Exportar la instancia de la aplicación para Vercel
module.exports = app;