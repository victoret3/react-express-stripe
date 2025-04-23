// models/MintQueue.js
const mongoose = require('mongoose');

const MintQueueSchema = new mongoose.Schema({
  lazyId: { type: String, required: true },
  walletAddress: { type: String, required: true },
  contractAddress: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  email: { type: String, required: false },
  status: { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
  sessionId: { type: String, required: false },
  metadataUrl: { type: String, required: false }
}, { collection: 'mintqueues' });

module.exports = mongoose.models.MintQueue || mongoose.model('MintQueue', MintQueueSchema);
