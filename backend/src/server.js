import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Carga variables de entorno
dotenv.config();

const configureServer = (app) => {
  // 1) CORS - Configuración ampliada
  const allowedOrigins = [
    'https://naniboronat.com',
    'https://nani-boronat.vercel.app',
    'https://nani-boronat-api.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  app.use(
    cors({
      origin: function(origin, callback) {
        // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          console.warn(`Origen no permitido: ${origin}`);
          callback(null, true); // Permitimos todos en desarrollo
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Manejar explícitamente las solicitudes preflight OPTIONS
  app.options('*', cors());

  // 2) parseo de JSON
  app.use(
    express.json({
      // Stripe Webhook requiere rawBody en /payment/session-complete
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/payment/session-complete') || 
            req.originalUrl.startsWith('/api/stripe/nft-webhook') ||
            req.originalUrl.startsWith('/api/payment/nft-webhook')) {
          req.rawBody = buf.toString();
        }
      },
    })
  );

  // 3) Logging básico de cada request
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // 4) Check de Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY no configurada en .env o variables de entorno');
  }

  // Info opcional
  console.log(`
[configureServer] Entorno: ${process.env.NODE_ENV || 'development'}
FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  `);
};

export default configureServer;