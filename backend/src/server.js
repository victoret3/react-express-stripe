import dotenv from 'dotenv';

// Siempre carga las variables al inicio
dotenv.config();
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY);
console.log('Frontend URL:', process.env.FRONTEND_URL);

import express from 'express';
import cors from 'cors';


const configureServer = (app) => {
  // Middleware para habilitar CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Cambia esto según tu frontend
    methods: ['GET', 'POST'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
  }));

  // Middleware para manejar JSON
  app.use(
    express.json({
      // Stripe necesita el cuerpo crudo para algunos endpoints
      verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/payment/session-complete')) {
          req.rawBody = buf.toString();
        }
      },
    })
  );

  // Middleware opcional: Para registrar peticiones durante el desarrollo
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Middleware para manejar CORS (si necesitas acceso desde el frontend)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir todas las conexiones (ajustar en producción)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Middleware para manejar errores de configuración
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY no está configurada en el archivo .env');
  }

  if (!process.env.FRONTEND_URL) {
    console.warn('⚠️  FRONTEND_URL no está configurada en el archivo .env');
  }
};

export default configureServer;
