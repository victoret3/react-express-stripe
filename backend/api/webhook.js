const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Middleware para manejar raw bodies para webhooks de Stripe
router.use(express.raw({ type: 'application/json' }));

router.post('/', async (req, res) => {
  try {
    console.log('⚡️ Webhook recibido - Respondiendo siempre con 200 OK');
    
    // El body llega como buffer, convertir a JSON
    let event;
    if (Buffer.isBuffer(req.body)) {
      const payload = req.body.toString('utf8');
      event = JSON.parse(payload);
    } else {
      event = req.body;
    }
    
    // Procesar evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`💰 Pago completado para sesión: ${session.id}`);
      
      try {
        // Obtener detalles de la compra
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        console.log(`📦 Items comprados: ${lineItems.data.length}`);
      
        // Actualizar stock para modo emergencia usando ID de MongoDB
        await updateStockEmergency(session.id);
      } catch (err) {
        console.error(`❌ Error obteniendo line items: ${err.message}`);
      }
    }
    
    // Siempre responder con éxito
    return res.status(200).send('OK');
  } catch (err) {
    console.error(`❌ Error en webhook: ${err.message}`);
    // Aún con error, responder 200 para evitar reintentos
    return res.status(200).send(`OK (con errores internos)`);
  }
});

// Función de actualización de stock en modo emergencia
async function updateStockEmergency(sessionId) {
  try {
    console.log('🚨 MODO EMERGENCIA: Actualizando stock usando primer producto disponible');
    
    // Conectar a MongoDB si no está conectado
    if (mongoose.connection.readyState !== 1) {
      console.log('Conectando a MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Conexión establecida');
    }
    
    // Definir o usar schema existente
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      image: { type: String },
      stock: { type: Number, default: 0 }
    });
    
    // Obtener o crear modelo
    const Product = mongoose.models.Product || 
      mongoose.model('Product', productSchema, 'products');
    
    // Encontrar el primer producto con stock > 0
    const product = await Product.findOne({ stock: { $gt: 0 } });
    
    if (!product) {
      console.log('❌ No se encontró ningún producto con stock disponible');
      return;
    }
    
    console.log(`✅ Producto seleccionado para actualizar: ${product.name} (ID: ${product._id})`);
    
    // Actualizar stock (restar 1)
    const oldStock = product.stock;
    product.stock = Math.max(0, oldStock - 1);
    await product.save();
    
    console.log(`🔄 Stock actualizado: ${oldStock} → ${product.stock}`);
    
    // Registrar la compra en una nueva colección como referencia
    const purchaseSchema = new mongoose.Schema({
      sessionId: String,
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      purchaseDate: { type: Date, default: Date.now },
      quantity: Number
    });
    
    const Purchase = mongoose.models.Purchase || 
      mongoose.model('Purchase', purchaseSchema, 'purchases');
    
    const purchase = new Purchase({
      sessionId,
      productId: product._id,
      productName: product.name,
      quantity: 1
    });
    
    await purchase.save();
    console.log('✅ Compra registrada en la base de datos');
    
  } catch (error) {
    console.error('❌ Error en modo emergencia:', error);
  }
}

// Función para actualizar el stock de productos
async function updateProductStock(items) {
  if (!items || items.length === 0) {
    console.log('No hay items para actualizar stock');
    return;
  }
  
  try {
    // Conectar a MongoDB si no está conectado
    if (mongoose.connection.readyState !== 1) {
      console.log('Conectando a MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Conexión establecida');
    }
    
    // Definir o usar schema existente
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      image: { type: String },
      stock: { type: Number, default: 0 },
      stripeProductId: { type: String }
    });
    
    // Obtener o crear modelo
    const Product = mongoose.models.Product || 
      mongoose.model('Product', productSchema, 'products');
    
    // Actualizar stock para cada item
    for (const item of items) {
      const productId = item.price.product;
      const quantity = item.quantity;
      
      console.log(`📝 Actualizando producto: ${productId}, cantidad: ${quantity}`);
      
      // Buscar por stripeProductId primero
      let product = await Product.findOne({ stripeProductId: productId });
      
      if (!product) {
        // Intentar buscar por _id como fallback
        try {
          product = await Product.findById(productId);
        } catch (e) {
          console.log(`Error buscando por ID: ${e.message}`);
        }
        
        if (!product) {
          console.log(`⚠️ Producto no encontrado: ${productId}`);
          
          // Mostrar todos los productos para debug
          const allProducts = await Product.find();
          console.log(`Productos disponibles (${allProducts.length}):`);
          allProducts.forEach(p => console.log(`- ${p.name}: ID=${p._id}, StripeID=${p.stripeProductId || 'N/A'}`));
          
          continue;
        }
      }
      
      // Actualizar stock
      const oldStock = product.stock;
      product.stock = Math.max(0, oldStock - quantity);
      await product.save();
      
      console.log(`✅ Stock actualizado: ${product.name} - ${oldStock} → ${product.stock}`);
    }
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
  }
}

module.exports = router;