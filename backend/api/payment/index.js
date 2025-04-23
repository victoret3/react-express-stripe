const express = require('express');
const router = express.Router();

router.post('/session-initiate', require('./session-initiate'));
router.post('/lazy-mint', require('./lazy-mint'));
router.get('/order', require('./order'));
// Agrega aquí otros endpoints si los tienes

module.exports = router;
