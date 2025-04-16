const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
let Product;
try {
  // Intentar importar usando require (CommonJS)
  Product = require('../src/models/Product').default;
} catch (error) {
  // Si falla, intentamos inicializar el modelo nosotros mismos
  const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String, default: 'https://via.placeholder.com/150' },
    stock: { type: Number, default: 1 },
  }, {
    timestamps: true,
  });
  Product = mongoose.model('Product', productSchema);
}

// Cargar ABI del contrato NFT para Lazy Minting
const nftLazyMintJson = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../../smart-contracts/artifacts/contracts/NaniBoronatLazyMint.sol/NaniBoronatLazyMint.json')
));

// También cargar el ABI del contrato anterior para compatibilidad
let nftJson;
try {
  nftJson = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../../smart-contracts/artifacts/contracts/NaniBoronatNFT.sol/NaniBoronatNFT.json')
  ));
} catch (error) {
  console.warn('No se encontró el contrato NaniBoronatNFT, solo funcionará el lazy minting');
}

// Endpoint para crear una sesión de pago para un NFT con Lazy Minting
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { lazyId, tokenId, collectionAddress, metadataUrl, name, price = '0.05', email, redirectUrl, useFixedPrice } = req.body;
    
    if (!lazyId || !email) {
      return res.status(400).json({ error: 'Faltan datos para procesar el pago' });
    }
    
    // Identificar qué tipo de NFT es (lazy mint o directo)
    const isLazyMint = !!lazyId && !tokenId;
    
    // Precio en EUR (fijo de 20€ o convertido desde ETH)
    let priceInEur = 20; // Precio fijo por defecto
    
    if (!useFixedPrice) {
      // Convertir precio de ETH a EUR (aprox. $3000 por ETH)
      const ethPrice = 3000; // Precio actual de ETH en USD (idealmente usar una API para esto)
      const usdToEur = 0.91; // Tasa de conversión aproximada USD a EUR
      priceInEur = parseFloat(price) * ethPrice * usdToEur;
    } else {
      // Si se usa precio fijo, el valor de price ya debería estar en EUR
      priceInEur = parseFloat(price);
    }
    
    // Crear un producto en Stripe para este NFT
    const product = await stripe.products.create({
      name: name || `NFT ${lazyId || tokenId}`,
      description: `NFT: ${name || 'Sin nombre'} (ID: ${lazyId || tokenId})`,
      metadata: {
        lazyId,
        tokenId,
        collectionAddress,
        metadataUrl,
        priceInEth: price,
        type: isLazyMint ? 'lazy_mint' : 'direct',
        useFixedPrice: useFixedPrice ? 'true' : 'false'
      }
    });
    
    // Crear un precio para el producto
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(priceInEur * 100), // Stripe usa centavos
      currency: 'eur', // Cambiar a EUR
    });
    
    // Crear una sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${redirectUrl || process.env.FRONTEND_URL}/nft-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl || process.env.FRONTEND_URL}/nft-cancel`,
      customer_email: email,
      metadata: {
        lazyId,
        tokenId,
        collectionAddress,
        metadataUrl,
        name: name || `NFT ${lazyId || tokenId}`,
        type: isLazyMint ? 'lazy_mint' : 'direct',
        useFixedPrice: useFixedPrice ? 'true' : 'false'
      }
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error al crear sesión de checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook para manejar eventos de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Manejar el evento de pago completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      console.log('Webhook recibido: checkout.session.completed', session.id);
      console.log('Metadatos de la sesión:', session.metadata);
      
      // Verificar si tenemos el campo type en los metadatos
      if (session.metadata && session.metadata.type) {
        // Es un NFT (lazy mint o direct)
        if (session.metadata.type === 'lazy_mint' || session.metadata.type === 'direct') {
          console.log(`🎮 Compra de NFT completada (${session.metadata.type})`);
          
          // Obtener los datos del NFT de los metadatos
          const { lazyId, tokenId, metadataUrl, name } = session.metadata;
          const customerEmail = session.customer_email;
          
          console.log(`🎉 Pago completado para NFT: ${name || lazyId || tokenId}`);
          console.log(`📧 Cliente: ${customerEmail}`);
          
          // Mintear según el tipo
          if (session.metadata.type === 'lazy_mint') {
            // Mintear el NFT usando el contrato de Lazy Mint
            await mintLazyNFT(lazyId, customerEmail);
          } else {
            // Usar el minteo directo (compatible con versión anterior)
            await mintDirectNFT(metadataUrl, tokenId, name, customerEmail);
          }
        } 
        else {
          // Es un producto normal de la tienda
          console.log('🛒 Compra de producto normal completada');
          
          // Procesar compra normal (actualizar inventario, etc.)
          try {
            // Obtener line items
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
              expand: ['data.price.product'],
            });
            
            console.log('Line items recuperados:', JSON.stringify(lineItems.data.map(item => ({
              productId: item.price?.product?.metadata?.productId,
              name: item.price?.product?.name,
              metadata: item.price?.product?.metadata
            })), null, 2));

            // Actualizar stock de cada producto (si aplica)
            for (const item of lineItems.data) {
              const productId = item.price?.product?.metadata?.productId;
              if (productId) {
                // Actualizar stock en la base de datos
                console.log(`Actualizando stock del producto ${productId}, -${item.quantity} unidades`);
                
                // SOLUCIÓN DRÁSTICA para forzar la actualización del producto
                try {
                  // 1. Primero lo intentamos con el modelo importado
                  console.log('Método 1: Usando modelo existente...');
                  
                  // Usar mongoose directamente
                  const mongoose = require('mongoose');
                  const productSchema = new mongoose.Schema({
                    name: { type: String, required: true },
                    price: { type: Number, required: true },
                    description: { type: String },
                    image: { type: String, default: 'https://via.placeholder.com/150' },
                    stock: { type: Number, default: 1 },
                  }, { timestamps: true });
                  
                  // Intentar acceder al modelo si ya existe
                  let ProductModel;
                  try {
                    ProductModel = mongoose.model('Product');
                    console.log('Modelo existente encontrado');
                  } catch (e) {
                    ProductModel = mongoose.model('Product', productSchema);
                    console.log('Nuevo modelo creado');
                  }
                  
                  // Intentar actualizar el stock
                  console.log(`Intentando actualizar producto: ${productId}`);
                  const producto = await ProductModel.findById(productId);
                  console.log('Producto encontrado:', producto ? 'SÍ' : 'NO');
                  
                  if (producto) {
                    console.log(`Stock actual: ${producto.stock}`);
                    const actualizado = await ProductModel.findByIdAndUpdate(
                      productId,
                      { $inc: { stock: -item.quantity } },
                      { new: true }
                    );
                    console.log(`✅ Stock actualizado para producto ${productId}. Nuevo stock: ${actualizado.stock}`);
                    
                    // Segunda verificación para confirmar que se actualizó
                    const verificacion = await ProductModel.findById(productId);
                    console.log(`Verificación: Stock actual después de actualizar: ${verificacion.stock}`);
                  } else {
                    console.error(`❌ Producto con ID ${productId} no encontrado`);
                  }
                } catch (stockError) {
                  console.error('Error al intentar actualizar stock con método 1:', stockError);
                }
              }
            }
          } catch (productError) {
            console.error('Error procesando productos regulares:', productError);
          }
        }
      } 
      else {
        // No tiene campo type, asumir que es un producto normal
        console.log('🛒 Compra regular (sin tipo específico) completada');
      }
      
      // Responder con éxito
      res.json({ received: true });
    } catch (error) {
      console.error('Error procesando el pago:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Otros eventos
    console.log(`Evento no manejado: ${event.type}`);
    res.json({ received: true });
  }
});

// Endpoint para obtener los detalles de un NFT minteado
router.get('/nft/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Determinar el tipo de minteo
    const isLazyMint = session.metadata.type === 'lazy_mint';
    
    // Buscar el NFT en los resultados correspondientes
    const resultadosPath = isLazyMint 
      ? path.join(__dirname, '../../smart-contracts/scripts/stripe-lazy-mint-resultados.json')
      : path.join(__dirname, '../../smart-contracts/scripts/stripe-mint-resultados.json');
    
    if (!fs.existsSync(resultadosPath)) {
      return res.status(202).json({ 
        status: 'processing', 
        message: 'El NFT está siendo procesado. Los resultados aún no están disponibles.' 
      });
    }
    
    try {
      const resultados = JSON.parse(fs.readFileSync(resultadosPath, 'utf8'));
      const nft = resultados.find(r => 
        r.customerEmail === session.customer_email && 
        (
          (isLazyMint && r.lazyId === session.metadata.lazyId) ||
          (!isLazyMint && r.requestedTokenId === session.metadata.tokenId)
        )
      );
      
      if (!nft) {
        return res.status(202).json({ 
          status: 'processing', 
          message: 'El NFT está siendo procesado. Por favor, intenta de nuevo en unos minutos.' 
        });
      }
      
      // Para seguridad, eliminar la clave privada antes de devolver al frontend
      if (nft.privateKey) {
        delete nft.privateKey;
      }
      
      res.json({ nft });
    } catch (error) {
      console.error('Error al leer resultados:', error);
      return res.status(500).json({ error: 'Error al leer resultados' });
    }
  } catch (error) {
    console.error('Error al obtener detalles del NFT:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para mintear manualmente un NFT después de una compra (por si el webhook no se procesa)
router.post('/mint-completed-payment', async (req, res) => {
  try {
    const { sessionId, forceComplete } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Se requiere sessionId' });
    }
    
    console.log(`Solicitud de minteo manual para sesión: ${sessionId}`);
    
    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Verificar si la sesión ya se ha pagado
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'La sesión no ha sido pagada', 
        paymentStatus: session.payment_status 
      });
    }
    
    // Verificar si los metadatos contienen la información necesaria
    if (!session.metadata || !session.metadata.type) {
      return res.status(400).json({ 
        error: 'Esta sesión no corresponde a un NFT o falta información', 
        metadata: session.metadata 
      });
    }
    
    // Determinar si es lazy mint o direct mint
    if (session.metadata.type === 'lazy_mint') {
      const { lazyId } = session.metadata;
      const customerEmail = session.customer_email;
      
      if (!lazyId) {
        return res.status(400).json({ error: 'Falta el ID del NFT (lazyId)' });
      }
      
      // Buscar si ya ha sido minteado antes
      const resultadosPath = path.join(__dirname, '../../smart-contracts/scripts/stripe-lazy-mint-resultados.json');
      let nftYaMintado = false;
      
      if (fs.existsSync(resultadosPath)) {
        try {
          const resultados = JSON.parse(fs.readFileSync(resultadosPath, 'utf8'));
          nftYaMintado = resultados.some(r => 
            r.lazyId === lazyId && 
            r.customerEmail === customerEmail &&
            r.success === true
          );
        } catch (error) {
          console.error('Error al leer archivo de resultados:', error);
        }
      }
      
      // Si ya está minteado y no se fuerza, retornar error
      if (nftYaMintado && !forceComplete) {
        return res.status(200).json({ 
          message: 'Este NFT ya ha sido minteado anteriormente',
          alreadyMinted: true
        });
      }
      
      // Mintear el NFT
      try {
        const resultado = await mintLazyNFT(lazyId, customerEmail);
        return res.json({ 
          success: true, 
          result: resultado,
          message: 'NFT minteado correctamente'
        });
      } catch (mintError) {
        return res.status(500).json({ 
          error: 'Error al mintear el NFT', 
          details: mintError.message 
        });
      }
    } 
    else if (session.metadata.type === 'direct') {
      const { metadataUrl, tokenId, name } = session.metadata;
      const customerEmail = session.customer_email;
      
      // Mintear con método direct
      try {
        const resultado = await mintDirectNFT(metadataUrl, tokenId, name, customerEmail);
        return res.json({ 
          success: true, 
          result: resultado,
          message: 'NFT minteado correctamente'
        });
      } catch (mintError) {
        return res.status(500).json({ 
          error: 'Error al mintear el NFT', 
          details: mintError.message 
        });
      }
    } 
    else {
      return res.status(400).json({ 
        error: 'Tipo de NFT no reconocido', 
        type: session.metadata.type 
      });
    }
  } catch (error) {
    console.error('Error al mintear manualmente el NFT:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint específico para webhooks de NFTs de Stripe
router.post('/nft-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // Usar una variable de entorno específica para el webhook de NFTs
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_NFT_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`NFT Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`NFT Webhook Error: ${err.message}`);
  }
  
  // Manejar solo el evento de pago completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      console.log('NFT Webhook recibido: checkout.session.completed', session.id);
      console.log('Metadatos de la sesión:', session.metadata);
      
      // Verificar que sea un NFT (debe tener type en los metadatos)
      if (session.metadata && (session.metadata.type === 'lazy_mint' || session.metadata.type === 'direct')) {
        console.log(`🎮 Compra de NFT completada (${session.metadata.type})`);
        
        // Obtener los datos del NFT de los metadatos
        const { lazyId, tokenId, metadataUrl, name } = session.metadata;
        const customerEmail = session.customer_email;
        
        console.log(`🎉 Pago completado para NFT: ${name || lazyId || tokenId}`);
        console.log(`📧 Cliente: ${customerEmail}`);
        
        // Mintear según el tipo
        if (session.metadata.type === 'lazy_mint') {
          // Mintear el NFT usando el contrato de Lazy Mint
          await mintLazyNFT(lazyId, customerEmail);
        } else {
          // Usar el minteo directo (compatible con versión anterior)
          await mintDirectNFT(metadataUrl, tokenId, name, customerEmail);
        }
        
        // Responder con éxito
        return res.json({ received: true, processed: true });
      } else {
        // No es un NFT reconocido
        console.log('Ignorando - no es un NFT válido');
        return res.json({ received: true, processed: false, reason: 'not_nft' });
      }
    } catch (error) {
      console.error('Error procesando NFT:', error);
      // Devolvemos 200 incluso con error para evitar reintentos
      return res.status(200).json({ 
        received: true,
        processed: false,
        error: error.message
      });
    }
  } else {
    // Otros eventos
    console.log(`Evento de NFT no manejado: ${event.type}`);
    res.json({ received: true, processed: false, reason: 'event_not_supported' });
  }
});

module.exports = router; 