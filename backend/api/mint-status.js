// Endpoint: /api/nft/mint-status?sessionId=... | ?lazyId=...
const mongoose = require('mongoose');

const MintQueueSchema = new mongoose.Schema({
  lazyId: String,
  walletAddress: String,
  contractAddress: String,
  createdAt: Date,
  email: String,
  status: String,
  processedAt: Date,
  transactionHash: String
}, { collection: 'mintqueues' });

const MintQueue = mongoose.models.MintQueue || mongoose.model('MintQueue', MintQueueSchema);

module.exports = async (req, res) => {
  // Permitir CORS solo a dominios permitidos (frontend prod y localhost)
  const allowedOrigins = [
    'https://naniboronat.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]); // fallback seguro
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sessionId, lazyId } = req.query;
  if (!sessionId && !lazyId) {
    return res.status(400).json({ error: 'sessionId o lazyId requerido' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    // Buscar por lazyId o sessionId
    let query = {};
    if (lazyId) query.lazyId = lazyId;
    if (sessionId) query.sessionId = sessionId;
    const mint = await MintQueue.findOne(query).sort({ createdAt: -1 });
    if (!mint) {
      return res.status(404).json({ error: 'No se encontró el mint para ese identificador' });
    }
    // Devolver solo los campos relevantes
    return res.json({
      status: mint.status,
      transactionHash: mint.transactionHash,
      contractAddress: mint.contractAddress,
      walletAddress: mint.walletAddress,
      lazyId: mint.lazyId,
      email: mint.email,
      createdAt: mint.createdAt,
      processedAt: mint.processedAt
    });
  } catch (error) {
    console.error('[NFT MINT STATUS] ERROR:', error);
    return res.status(500).json({ error: 'Error interno', details: error.message });
  }
};
