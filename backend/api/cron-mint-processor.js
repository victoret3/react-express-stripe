const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
require('dotenv').config();
const mongoose = require('mongoose');

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

// Esquema para la cola de minteo (para acceso directo)
const mintQueueSchema = new mongoose.Schema({
  nftId: String,
  walletAddress: String,
  metadataUrl: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: String,
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date
});

let MintQueue;
try {
  MintQueue = mongoose.model('MintQueue');
} catch (error) {
  MintQueue = mongoose.model('MintQueue', mintQueueSchema);
}

// Endpoint para ejecutar el cron job (HTTP GET)
router.get('/', async (req, res) => {
  console.log('🔔 Cron job iniciado por Vercel');
  try {
    // Conectar a MongoDB directamente
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGO_URI no está configurada en variables de entorno');
      }
      await mongoose.connect(mongoUri);
      console.log('Conectado a MongoDB');
    }
    
    // Obtener NFTs pendientes directamente de la base de datos
    const pendingItems = await MintQueue.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(5)
      .lean(); // Usar lean para mejor rendimiento
    
    if (pendingItems.length === 0) {
      return res.json({
        success: true,
        message: 'No hay NFTs pendientes para mintear'
      });
    }
        
    // Enviar transacciones y esperar a que se envíen (no a que se confirmen)
    const results = await sendTransactions(pendingItems);
    
    // Responder con los resultados
    res.json({
      success: true,
      message: `Transacciones enviadas a la blockchain`,
      items: results
    });
    
  } catch (error) {
    console.error('❌ Error en cron job:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error desconocido' 
    });
  }
});

// Función para enviar transacciones y esperar a que se envíen
async function sendTransactions(pendingItems) {
  const results = [];
  
  try {
    console.log(`🚀 Iniciando envío de ${pendingItems.length} transacciones`);
    
    const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY no está configurada en variables de entorno');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Wallet Address:', wallet.address);
    
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS no está configurada en variables de entorno');
    }
    console.log('Contract Address:', contractAddress);
    
    const nftContract = new ethers.Contract(contractAddress, minABI, wallet);
    
    for (const item of pendingItems) {
      try {
        console.log(`🔄 Enviando transacción para wallet=${item.walletAddress}, metadata=${item.metadataUrl}`);
        
        await MintQueue.updateOne(
          { _id: item._id }, 
          { $set: { status: 'processing' } }
        );
        
        console.log('📝 Preparando transacción...');
        try {
          // Intentar estimar el gas primero
          const gasEstimate = await nftContract.estimateGas.safeMint(
            item.walletAddress, 
            item.metadataUrl, 
            1000
          );
          console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
        } catch (gasError) {
          console.error('❌ Error estimando gas:', gasError);
          throw gasError;
        }
        
        console.log('📤 Enviando transacción...');
        const tx = await nftContract.safeMint(
          item.walletAddress, 
          item.metadataUrl, 
          1000,
          {
            gasLimit: 500000
          }
        );
        console.log(`✅ Transacción enviada con hash: ${tx.hash}`);
        
        // Actualizar el estado y guardar el hash
        await MintQueue.updateOne(
          { _id: item._id }, 
          { 
            $set: { 
              status: 'processing',
              transactionHash: tx.hash,
              processedAt: new Date()
            } 
          }
        );
        
        // Añadir a resultados
        results.push({
          walletAddress: item.walletAddress,
          metadataUrl: item.metadataUrl,
          transactionHash: tx.hash,
          status: 'sent'
        });
        
        // Iniciar confirmación en background
        confirmTransaction(tx, item._id);
        
      } catch (txError) {
        console.error('❌ Error en transacción:', txError);
        if (txError.error) {
          console.error('Detalles del error:', txError.error);
        }
        if (txError.reason) {
          console.error('Razón del error:', txError.reason);
        }
        if (txError.code) {
          console.error('Código de error:', txError.code);
        }
        
        await MintQueue.updateOne(
          { _id: item._id }, 
          { 
            $set: { 
              status: 'failed', 
              errorMessage: txError.message,
              processedAt: new Date() 
            } 
          }
        );
        
        results.push({
          walletAddress: item.walletAddress,
          metadataUrl: item.metadataUrl,
          error: txError.message,
          status: 'failed'
        });
      }
    }
    
    console.log('✅ Proceso de envío de transacciones completado');
    return results;
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    if (error.error) {
      console.error('Detalles del error:', error.error);
    }
    if (error.reason) {
      console.error('Razón del error:', error.reason);
    }
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    throw error;
  }
}

// Función para confirmar transacciones en background
async function confirmTransaction(tx, itemId) {
  try {
    console.log(`⏳ Esperando confirmación para hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transacción confirmada en el bloque ${receipt.blockNumber}`);
    
    await MintQueue.updateOne(
      { _id: itemId }, 
      { 
        $set: { 
          status: 'completed',
          processedAt: new Date()
        } 
      }
    );
    console.log('✅ NFT actualizado en la base de datos');
  } catch (error) {
    console.error(`❌ Error confirmando transacción ${tx.hash}:`, error);
    await MintQueue.updateOne(
      { _id: itemId }, 
      { 
        $set: { 
          status: 'failed',
          errorMessage: error.message,
          processedAt: new Date()
        } 
      }
    );
  }
}

// Si este archivo se ejecuta directamente (node cron-mint-processor.js)
if (require.main === module) {
  console.log('Ejecutando manualmente el procesador de cola de minteo');
  
  // Crear una solicitud ficticia y respuesta para probar la función principal
  const req = {};
  const res = {
    json: (data) => {
      console.log('Respuesta:', data);
      process.exit(0);
    },
    status: (code) => {
      console.log(`Status code: ${code}`);
      return {
        json: (data) => {
          console.log('Error:', data);
          process.exit(1);
        }
      };
    }
  };
  
  // Ejecutar el handler principal
  router.handle(req, res).catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

// Exportar el router
module.exports = router; 