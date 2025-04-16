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
        
        // IMPORTANTE: Verificar si es un NFT o un producto normal
        const isNftTransaction = session.metadata && session.metadata.type === 'lazy_mint';
        
        if (isNftTransaction) {
          console.log('🔷 Esta es una transacción de NFT - NO se actualizará ningún stock de producto');
          // Para NFTs, podríamos registrar la compra o activar el proceso de minteo, pero no afectar el stock
          const lazyId = session.metadata.lazyId;
          const walletAddress = session.metadata.walletAddress;
          const metadataUrl = session.metadata.metadataUrl;
          
          console.log(`💎 NFT adquirido: LazyID=${lazyId}, Wallet=${walletAddress}`);
          
          // EJECUTAR EL MINTEO DEL NFT
          await mintNFT(lazyId, walletAddress, metadataUrl);
        } else {
          console.log('🛒 Esta es una compra de producto normal - Actualizando stock');
          // Para productos normales, actualizar el stock
          await updateProductStock(lineItems.data);
        }
      } catch (err) {
        console.error(`❌ Error procesando la compra: ${err.message}`);
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

// Función para mintear NFT directamente
async function mintNFT(lazyId, walletAddress, metadataUrl) {
  try {
    console.log(`⚙️ Iniciando proceso de minteo para NFT: ${lazyId}`);
    
    // Cargar ethers.js
    const ethers = require('ethers');
    
    // Verificar que tenemos la private key y dirección del contrato
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    // Validaciones
    if (!privateKey) {
      throw new Error('No se encontró PRIVATE_KEY en las variables de entorno');
    }
    
    if (!contractAddress) {
      throw new Error('No se encontró NFT_CONTRACT_ADDRESS en las variables de entorno');
    }
    
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error(`La dirección de wallet ${walletAddress} no es válida`);
    }
    
    // ABI mínimo necesario para mintear NFT
    const NFT_ABI = [
      "function mint(address to, string memory tokenId) external returns (uint256)",
      "function mintTo(address to, string memory uri) external returns (uint256)"
    ];
    
    // Configurar provider y wallet
    console.log(`🔌 Conectando a RPC: ${process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'}`);
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
    );
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`🔑 Wallet lista para mintear: ${wallet.address}`);
    
    // Crear instancia del contrato
    const nftContract = new ethers.Contract(contractAddress, NFT_ABI, wallet);
    console.log(`📄 Contrato NFT cargado en: ${contractAddress}`);
    
    // Mintear el NFT
    let tx;
    let method = '';
    
    if (metadataUrl) {
      console.log(`🔗 Usando metadataUrl: ${metadataUrl}`);
      method = 'mintTo';
      tx = await nftContract.mintTo(walletAddress, metadataUrl, { 
        gasLimit: 500000 
      });
    } else {
      console.log(`🆔 Usando lazyId: ${lazyId}`);
      method = 'mint';
      tx = await nftContract.mint(walletAddress, lazyId, { 
        gasLimit: 500000 
      });
    }
    
    console.log(`📤 Transacción de minteo enviada. Hash: ${tx.hash}, Método: ${method}`);
    
    // Esperar a que la transacción se confirme
    console.log('⏳ Esperando confirmación de la transacción...');
    const receipt = await tx.wait();
    
    console.log(`✅ NFT MINTEADO CON ÉXITO! Hash: ${receipt.transactionHash}`);
    console.log(`   Bloque: ${receipt.blockNumber}, Gas usado: ${receipt.gasUsed.toString()}`);
    
    // Intentar registrar en la base de datos (pero no es crítico)
    try {
      await registerMintedNFT({
        lazyId,
        walletAddress,
        metadataUrl,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date()
      });
    } catch (dbError) {
      console.log('⚠️ No se pudo registrar en MongoDB, pero el NFT ya está minteado correctamente');
      console.log(`   Error: ${dbError.message}`);
    }
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error('❌ ERROR AL MINTEAR NFT:', error);
    console.error('   Mensaje:', error.message);
    
    // Intentar registrar el error en base de datos (pero no es crítico)
    try {
      await registerMintError({
        lazyId,
        walletAddress,
        error: error.message,
        timestamp: new Date()
      });
    } catch (dbError) {
      console.error('Error adicional al intentar registrar error:', dbError.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Registrar NFT minteado en la base de datos
async function registerMintedNFT(data) {
  try {
    // Comprobar si MongoDB está configurado
    if (!process.env.MONGO_URI) {
      console.log('⚠️ No hay MONGO_URI configurado, saltando registro en base de datos');
      return;
    }

    // Conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Intentando conectar a MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Conexión a MongoDB establecida');
    }
    
    // Esquema para NFTs minteados
    const mintedNFTSchema = new mongoose.Schema({
      lazyId: String,
      walletAddress: String,
      metadataUrl: String,
      txHash: String,
      blockNumber: Number,
      timestamp: Date
    });
    
    // Modelo
    const MintedNFT = mongoose.models.MintedNFT || 
      mongoose.model('MintedNFT', mintedNFTSchema, 'minted_nfts');
    
    // Guardar registro
    const newMintedNFT = new MintedNFT(data);
    await newMintedNFT.save();
    
    console.log(`📝 NFT registrado en base de datos: ${data.lazyId}`);
    
  } catch (error) {
    console.error('❌ Error al registrar NFT minteado:', error.message);
    // No lanzamos el error para que no afecte al flujo principal
  }
}

// Registrar error de minteo
async function registerMintError(data) {
  try {
    // Comprobar si MongoDB está configurado
    if (!process.env.MONGO_URI) {
      console.log('⚠️ No hay MONGO_URI configurado, saltando registro en base de datos');
      return;
    }
    
    // Conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Intentando conectar a MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Conexión a MongoDB establecida');
    }
    
    // Esquema para errores de minteo
    const mintErrorSchema = new mongoose.Schema({
      lazyId: String,
      walletAddress: String,
      error: String,
      timestamp: Date,
      resolved: { type: Boolean, default: false }
    });
    
    // Modelo
    const MintError = mongoose.models.MintError || 
      mongoose.model('MintError', mintErrorSchema, 'mint_errors');
    
    // Guardar registro
    const newMintError = new MintError(data);
    await newMintError.save();
    
    console.log(`📝 Error de minteo registrado en base de datos: ${data.lazyId}`);
    
  } catch (error) {
    console.error('❌ Error al registrar error de minteo:', error.message);
    // No lanzamos el error para que no afecte al flujo principal
  }
}

module.exports = router;