import mongoose from 'mongoose';

const NftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  metadata: { type: Object, default: {} },
  tokenId: { type: String },
  minted: { type: Boolean, default: false },
  owner: { type: String }, // Dirección de wallet o email del usuario
  mintedAt: { type: Date },
  paymentId: { type: String }, // ID de la sesión de Stripe
});

export default mongoose.model('Nft', NftSchema);
