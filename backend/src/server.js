import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Carga variables de entorno
dotenv.config();

const configureServer = (app) => {
  // 1) CORS
  app.use(
    cors({
      origin: [
        'https://naniboron.web.app',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 2) parseo de JSON
  app.use(
    express.json({
      // Stripe Webhook requiere rawBody en /payment/session-complete
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/api/payment/session-complete')) {
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