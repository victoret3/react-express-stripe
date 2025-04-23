const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Configuración inicial
const app = express();

// Middleware global para forzar CORS y OPTIONS (compatibilidad máxima con Vercel)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, stripe-signature');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware general de CORS (aplicar antes de cualquier ruta)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature']
}));

// Importar y montar el handler del webhook de Stripe (RAW BODY SOLO PARA WEBHOOK)
const webhookHandler = require('./webhook');
app.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Middleware global para el resto de rutas
app.use(express.json());

// Importar y montar las rutas de pago (asegurar que estén después del CORS y JSON)
const paymentRoutes = require('./payment');
app.use('/api/payment', paymentRoutes);


  // Conectar a MongoDB usando la variable de entorno
  if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ Conectado a MongoDB con MONGO_URI'))
      .catch(err => console.error('❌ Error conectando a MongoDB:', err));
  } else {
    console.log('⚠️ No se encontró MONGO_URI en las variables de entorno');
  }

  // Ruta de verificación
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Exportar la instancia de la aplicación para Vercel
module.exports = (req, res) => app(req, res);