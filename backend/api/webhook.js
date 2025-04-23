import Stripe from 'stripe';
import mongoose from 'mongoose';

let getRawBody;
try {
  getRawBody = require('raw-body');
} catch (e) {
  console.warn('raw-body no está instalado. Instálalo con: npm install raw-body');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).end('Missing Stripe signature');

  let rawBody;
  try {
    if (getRawBody) {
      rawBody = await getRawBody(req);
      console.log('rawBody (Buffer):', rawBody && rawBody.length, 'bytes');
    } else {
      rawBody = await req.text();
      console.log('rawBody (string):', typeof rawBody, rawBody.length, 'chars');
    }
  } catch (err) {
    console.error('Error leyendo el body crudo:', err);
    return res.status(400).end('Error leyendo el body crudo');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Stripe event type:', event.type);
  } catch (err) {
    console.error('⚠️  Error verificando firma Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    try {
      // Conectar a Mongo si es necesario
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI);
      }
      // --- CASO NFT ---
      if (metadata.type === 'lazy_mint') {
        // Usa el modelo MintQueue real (con status)
        const MintQueue = require('../models/MintQueue');
        // Protección contra duplicados en MintQueue
        const existingMint = await MintQueue.findOne({
          lazyId: metadata.lazyId,
          walletAddress: metadata.walletAddress,
          contractAddress: metadata.contractAddress
        });
        if (!existingMint) {
          const mintDoc = await MintQueue.create({
            nftId: metadata.lazyId, // Para el índice único
            lazyId: metadata.lazyId,
            walletAddress: metadata.walletAddress,
            contractAddress: metadata.contractAddress,
            createdAt: new Date(),
            email: session.customer_email || '',
            status: 'pending'
          });
          if (!mintDoc.status || mintDoc.status !== 'pending') {
            console.warn('[MintQueue] ¡Cuidado! El campo status no se guardó como "pending":', mintDoc);
          }
          console.log('✅ NFT añadido a MintQueue');
        } else {
          console.log('⚠️ Ya existe en MintQueue, no se duplica');
        }
        // Dispara el cron inmediatamente tras la compra NFT (no espera resultado)
        try {
          fetch('https://nani-boronat-api.vercel.app/api/cron-mint-processor', { method: 'POST' })
            .then(() => console.log('🚀 Cron de minteo disparado tras compra NFT'))
            .catch(e => console.warn('No se pudo disparar el cron de minteo:', e));
        } catch (e) {
          console.warn('Error lanzando fetch al cron:', e);
        }
        // Guardar orden para NFT
        const Order = require('../models/Order');
        // Protección contra duplicados en Order
        const existingOrder = await Order.findOne({ sessionId: session.id });
        if (!existingOrder) {
          await Order.create({
            sessionId: session.id,
            email: session.customer_email,
            items: [{
              lazyId: metadata.lazyId,
              walletAddress: metadata.walletAddress,
              contractAddress: metadata.contractAddress,
              price: session.amount_total / 100,
            }],
            total: session.amount_total / 100,
            status: 'paid',
            createdAt: new Date()
          });
          console.log('✅ Order guardada para NFT');
        } else {
          console.log('⚠️ Order ya existe para este sessionId, no se duplica');
        }
      } else {
        // --- CASO PRODUCTO FÍSICO ---
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        // LOG para depuración: muestra todos los campos de los lineItems
        console.log('--- LINE ITEMS COMPLETOS ---');
        lineItems.data.forEach((item, idx) => {
          console.log(`ITEM [${idx}]:`, JSON.stringify(item, null, 2));
          if (item.price) {
            console.log(`item.price.metadata:`, JSON.stringify(item.price.metadata, null, 2));
            if (item.price.product && typeof item.price.product === 'object') {
              console.log(`item.price.product.metadata:`, JSON.stringify(item.price.product.metadata, null, 2));
            }
          }
        });
        await updateProductStock(lineItems.data);
        console.log('✅ Stock actualizado tras compra de producto físico');
        // Guardar orden para producto físico
        const Order = require('../models/Order');
        await Order.create({
          sessionId: session.id,
          email: session.customer_email,
          items: lineItems.data.map(item => ({
            productId: item.price.product,
            description: item.description,
            quantity: item.quantity,
            price: item.amount_total ? item.amount_total / 100 : undefined,
            stripeProductId: item.price.product
          })),
          total: session.amount_total / 100,
          status: 'paid',
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error('❌ Error procesando el evento de Stripe:', err);
    }
  }
    return res.status(200).end();
};

// Función para actualizar stock
async function updateProductStock(items, sessionMetadata) {
  const Product = require('../src/models/Product');
  let processed = false;
  // 1. Intenta descontar stock usando los line items (método clásico)
  for (const item of items) {
    const quantity = item.quantity;
    let product = null;
    // Buscar SOLO por descripción
    if (item.description) {
      product = await Product.findOne({ name: item.description });
      if (product) {
        console.log(`[Stock] Producto encontrado por descripción (${item.description}):`, product._id);
      }
    }
    if (!product) {
      console.warn(`[Stock] No se encontró producto para item por descripción:`, item);
      continue;
    }
    if (typeof product.stock === 'number') {
      product.stock = Math.max(0, product.stock - quantity);
      await product.save();
      console.log(`[Stock] Stock actualizado para producto ${product._id} (${product.name}): ${product.stock}`);
    } else {
      console.warn(`[Stock] El producto ${product._id} no tiene campo stock numérico.`);
    }
    processed = true;
  }
  // 2. Si no se pudo procesar ningún producto por los line items, usa session.metadata.items
  if (!processed && sessionMetadata && sessionMetadata.items) {
    try {
      const fallbackItems = JSON.parse(sessionMetadata.items);
      const Product = require('../src/models/Product');
      for (const fallback of fallbackItems) {
        if (!fallback.productId) continue;
        const product = await Product.findById(fallback.productId);
        if (!product) {
          console.warn(`[Stock][Fallback] No se encontró producto con _id:`, fallback.productId);
          continue;
        }
        if (typeof product.stock === 'number') {
          product.stock = Math.max(0, product.stock - fallback.quantity);
          await product.save();
          console.log(`[Stock][Fallback] Stock actualizado para producto ${product._id} (${product.name}): ${product.stock}`);
        } else {
          console.warn(`[Stock][Fallback] El producto ${product._id} no tiene campo stock numérico.`);
        }
      }
    } catch (e) {
      console.warn('[Stock][Fallback] Error procesando session.metadata.items:', e.message);
    }
  }
}
