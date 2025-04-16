// Este archivo sirve como punto de entrada para el servidor Express
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Rutas
const paymentRoutes = require('./routes/payment');
const productRoutes = require('./routes/product');
const nftRoutes = require('./routes/nft');

// Configuración inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware general de CORS
app.use(cors());

// Middleware específico para webhooks de Stripe
app.use((req, res, next) => {
  if (
    req.originalUrl === '/api/payment/webhook' || 
    req.originalUrl === '/api/payment/nft-webhook'
  ) {
    // Para rutas de webhook, usar raw body para verificación de firma
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Para otras rutas, usar el parser de JSON estándar
    express.json()(req, res, next);
  }
});

// Verificar que estamos capturando el cuerpo crudo correctamente
app.use((req, res, next) => {
  if (
    (req.originalUrl === '/api/payment/webhook' || 
     req.originalUrl === '/api/payment/nft-webhook') &&
    req.method === 'POST'
  ) {
    console.log('⚠️ Middleware webhook activado');
    console.log('Tipo de req.body:', typeof req.body);
    console.log('¿Es Buffer?:', Buffer.isBuffer(req.body));
  }
  next();
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conexión a MongoDB establecida'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Configurar rutas
app.use(paymentRoutes);
app.use(productRoutes);
app.use(nftRoutes);

// Ruta de verificación
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  
  // Mostrar información de configuración (solo entorno dev)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Variables de entorno cargadas:');
    console.log(`- STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✓ Configurado' : '✗ No configurado'}`);
    console.log(`- STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✓ Configurado' : '✗ No configurado'}`);
    console.log(`- MONGO_URI: ${process.env.MONGO_URI ? '✓ Configurado' : '✗ No configurado'}`);
  }
});
