// Endpoint mínimo para verificar webhook
const express = require('express');
const router = express.Router();

// Usar express.raw para recibir el cuerpo como Buffer
router.use(express.raw({ type: 'application/json' }));

router.post('/', async (req, res) => {
  console.log('⚡️ Webhook simple recibido');
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('¿Es req.body un buffer?', Buffer.isBuffer(req.body));
  
  // Responder siempre con 200
  return res.status(200).send('OK - Simple Webhook');
});

module.exports = router; 