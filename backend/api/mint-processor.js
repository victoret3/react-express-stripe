const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config();

// Middleware para manejar CORS
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware para verificar la API key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Obtener la API key desde la variable de entorno
  const validApiKey = process.env.MINT_API_KEY || 'default-key-for-development';
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: API key inválida o faltante'
    });
  }
  
  next();
};

// Esquema para la cola de minteo
const mintQueueSchema = new mongoose.Schema({
  nftId: String,
  walletAddress: String,
  metadataUrl: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'pending_confirmation', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: String,
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
  lastChecked: Date
});

let MintQueue;
try {
  MintQueue = mongoose.model('MintQueue');
} catch (error) {
  MintQueue = mongoose.model('MintQueue', mintQueueSchema);
}

// Configuración mínima de ABI para minteo
const minABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
      { name: "royaltyPercentage", type: "uint256" }
    ],
    name: "safeMint",
    outputs: [
      { name: "", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// Función para enviar la transacción de minteo (Paso 1)
async function startMintNFT(walletAddress, metadataUrl) {
  try {
    // Validar dirección de wallet
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error(`Dirección de wallet inválida: ${walletAddress}`);
    }

    // Configurar proveedor y wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "https://rpc-mumbai.maticvigil.com");
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY no está configurada en variables de entorno');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Dirección del contrato NFT
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS no está configurada en variables de entorno');
    }
    
    // Crear instancia del contrato
    const nftContract = new ethers.Contract(contractAddress, minABI, wallet);
    
    console.log(`Iniciando minteo de NFT: wallet=${walletAddress}, metadata=${metadataUrl}`);
    
    // Llamar a la función safeMint del contrato (solo owner puede hacerlo)
    // Usamos un porcentaje de royalty del 5% (500)
    const tx = await nftContract.safeMint(walletAddress, metadataUrl, 500);
    
    console.log(`Transacción enviada: ${tx.hash}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      message: 'Transacción enviada, esperando confirmación'
    };
  } catch (error) {
    console.error(`Error al iniciar minteo de NFT:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para verificar el estado de una transacción (Paso 2)
async function checkTransactionStatus(transactionHash) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "https://rpc-mumbai.maticvigil.com");
    
    // Obtener recibo de la transacción
    const receipt = await provider.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return {
        confirmed: false,
        message: 'Transacción pendiente de confirmación'
      };
    }
    
    if (receipt.status === 1) {
      console.log(`NFT minteado exitosamente: ${transactionHash}`);
      return {
        confirmed: true,
        success: true,
        receipt: receipt
      };
    } else {
      console.error(`Transacción fallida: ${transactionHash}`);
      return {
        confirmed: true,
        success: false,
        error: 'La transacción falló en la blockchain',
        receipt: receipt
      };
    }
  } catch (error) {
    console.error(`Error al verificar transacción:`, error);
    return {
      confirmed: false,
      error: error.message
    };
  }
}

// Endpoint para procesar un elemento específico de la cola
router.post('/process/:id', verifyApiKey, async (req, res) => {
  try {
    // Conexión a MongoDB
    await ensureDbConnection();
    
    const { id } = req.params;
    
    // Buscar y actualizar el estado a 'processing'
    const queueItem = await MintQueue.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { status: 'processing' },
      { new: true }
    );
    
    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: 'Elemento no encontrado o ya en procesamiento'
      });
    }
    
    // Iniciar el minteo del NFT (Paso 1)
    const mintResult = await startMintNFT(
      queueItem.walletAddress,
      queueItem.metadataUrl
    );
    
    // Actualizar el registro con el resultado del paso 1
    if (mintResult.success) {
      await MintQueue.findByIdAndUpdate(id, {
        status: 'pending_confirmation',
        transactionHash: mintResult.transactionHash,
        lastChecked: new Date()
      });
      
      return res.json({
        success: true,
        message: 'Transacción iniciada, esperando confirmación',
        transactionHash: mintResult.transactionHash
      });
    } else {
      await MintQueue.findByIdAndUpdate(id, {
        status: 'failed',
        errorMessage: mintResult.error,
        processedAt: new Date()
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar minteo de NFT',
        error: mintResult.error
      });
    }
  } catch (error) {
    console.error('Error en proceso de minteo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para procesar el siguiente elemento en la cola
router.post('/process-next', verifyApiKey, async (req, res) => {
  try {
    // Conexión a MongoDB
    await ensureDbConnection();
    
    // 1. Primero, intentar verificar transacciones pendientes de confirmación
    const pendingConfirmation = await MintQueue.findOne({ status: 'pending_confirmation' })
      .sort({ lastChecked: 1 })
      .limit(1);
    
    if (pendingConfirmation) {
      // Verificar si ya pasó suficiente tiempo desde la última comprobación (mínimo 30 segundos)
      const now = new Date();
      const lastChecked = pendingConfirmation.lastChecked || pendingConfirmation.createdAt;
      const timeDiff = now - lastChecked;
      
      // Si ya pasaron al menos 30 segundos desde la última verificación
      if (timeDiff > 30000) {
        console.log(`Verificando transacción pendiente: ${pendingConfirmation.transactionHash}`);
        
        // Verificar estado de la transacción (Paso 2)
        const txStatus = await checkTransactionStatus(pendingConfirmation.transactionHash);
        
        // Actualizar la hora de la última verificación
        pendingConfirmation.lastChecked = now;
        await pendingConfirmation.save();
        
        if (txStatus.confirmed) {
          if (txStatus.success) {
            // Transacción exitosa
            pendingConfirmation.status = 'completed';
            pendingConfirmation.processedAt = now;
            await pendingConfirmation.save();
            
            return res.json({
              success: true,
              message: 'NFT minteado exitosamente',
              transactionHash: pendingConfirmation.transactionHash,
              nftId: pendingConfirmation.nftId,
              walletAddress: pendingConfirmation.walletAddress
            });
          } else {
            // Transacción fallida
            pendingConfirmation.status = 'failed';
            pendingConfirmation.errorMessage = txStatus.error;
            pendingConfirmation.processedAt = now;
            await pendingConfirmation.save();
            
            return res.status(500).json({
              success: false,
              message: 'Transacción fallida en la blockchain',
              error: txStatus.error,
              transactionHash: pendingConfirmation.transactionHash
            });
          }
        } else {
          // Todavía pendiente, informar y continuar con el siguiente
          return res.json({
            success: true,
            message: 'Transacción aún pendiente de confirmación',
            transactionHash: pendingConfirmation.transactionHash
          });
        }
      } else {
        // Si no ha pasado suficiente tiempo, informar que aún está pendiente
        return res.json({
          success: true,
          message: 'Transacción pendiente, demasiado pronto para verificar',
          transactionHash: pendingConfirmation.transactionHash,
          nextCheckIn: Math.floor((30000 - timeDiff) / 1000) + ' segundos'
        });
      }
    }
    
    // 2. Si no hay transacciones pendientes o ya las verificamos, procesar siguiente pendiente
    const nextItem = await MintQueue.findOne({ status: 'pending' }).sort({ createdAt: 1 });
    
    if (!nextItem) {
      return res.json({
        success: false,
        message: 'No hay elementos pendientes en la cola'
      });
    }
    
    // Actualizar estado a 'processing'
    nextItem.status = 'processing';
    await nextItem.save();
    
    // Iniciar el minteo del NFT (Paso 1)
    const mintResult = await startMintNFT(
      nextItem.walletAddress,
      nextItem.metadataUrl
    );
    
    // Actualizar el registro con el resultado del paso 1
    if (mintResult.success) {
      nextItem.status = 'pending_confirmation';
      nextItem.transactionHash = mintResult.transactionHash;
      nextItem.lastChecked = new Date();
      await nextItem.save();
      
      return res.json({
        success: true,
        message: 'Transacción iniciada, esperando confirmación',
        transactionHash: mintResult.transactionHash,
        nftId: nextItem.nftId,
        walletAddress: nextItem.walletAddress
      });
    } else {
      nextItem.status = 'failed';
      nextItem.errorMessage = mintResult.error;
      nextItem.processedAt = new Date();
      await nextItem.save();
      
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar minteo de NFT',
        error: mintResult.error,
        nftId: nextItem.nftId,
        walletAddress: nextItem.walletAddress
      });
    }
  } catch (error) {
    console.error('Error en proceso de minteo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para obtener la lista de elementos en la cola
router.get('/list', verifyApiKey, async (req, res) => {
  try {
    // Conexión a MongoDB
    await ensureDbConnection();
    
    // Obtener todos los elementos, ordenados por fecha de creación
    const queueItems = await MintQueue.find().sort({ createdAt: 1 });
    
    return res.json(queueItems);
  } catch (error) {
    console.error('Error al obtener la cola:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Función auxiliar para garantizar la conexión a MongoDB
async function ensureDbConnection() {
  // Verificar si ya estamos conectados
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  // Obtener URI de MongoDB desde variables de entorno
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('MONGO_URI no está configurada en variables de entorno');
  }
  
  // Conectar a MongoDB
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log('Conectado a MongoDB');
}

module.exports = router; 