const express = require('express');
const router = express.Router();

// Endpoint para verificar CORS
router.get('/', (req, res) => {
  // Configuración CORS específica
  res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Devolver información de diagnóstico
  res.json({
    message: 'API funcionando correctamente',
    cors: 'configurado para permitir credenciales',
    timestamp: new Date().toISOString(),
    headers: {
      'Access-Control-Allow-Origin': 'https://naniboron.web.app',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers,
      ip: req.ip
    }
  });
});

// Endpoint para test de OPTIONS
router.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Endpoint para test de POST
router.post('/', (req, res) => {
  // Configuración CORS específica
  res.setHeader('Access-Control-Allow-Origin', 'https://naniboron.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Devolver body recibido
  res.json({
    message: 'POST recibido correctamente',
    received: req.body,
    headers: req.headers
  });
});

module.exports = router; 