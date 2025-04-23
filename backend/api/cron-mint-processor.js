
const { ethers } = require('ethers');
require('dotenv').config();
const mongoose = require('mongoose');

// Configuración mínima de ABI para minteo
const minABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseTokenURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contractURI_",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "royaltyPercentage",
        "type": "uint256"
      }
    ],
    "name": "LazyNFTRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "NFTLazyMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "royaltyRecipient2",
        "type": "address"
      }
    ],
    "name": "RoyaltyRecipientUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "availableNFTIds",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "availableNFTs",
    "outputs": [
      {
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "royaltyPercentage",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "lazyIds",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "metadataURIs",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "prices",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "royaltyPercentages",
        "type": "uint256[]"
      }
    ],
    "name": "batchRegisterLazyNFTs",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "creators",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "salePrice",
        "type": "uint256"
      }
    ],
    "name": "extendedRoyaltyInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "recipient1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient2",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount1",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount2",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableNFTCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableNFTIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getCreator",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getRoyaltyPercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "mintForRecipient",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "mintedLazyIds",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      }
    ],
    "name": "purchaseAndMint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadataURI",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "royaltyPercentage",
        "type": "uint256"
      }
    ],
    "name": "registerLazyNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "royalties",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "salePrice",
        "type": "uint256"
      }
    ],
    "name": "royaltyInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "royaltyAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "royaltyRecipient1",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "royaltyRecipient2",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newBaseURI",
        "type": "string"
      }
    ],
    "name": "setBaseURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "contractURI_",
        "type": "string"
      }
    ],
    "name": "setContractURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "lazyId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "setLazyNFTPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newMaxSupply",
        "type": "uint256"
      }
    ],
    "name": "setMaxSupply",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newPrice",
        "type": "uint256"
      }
    ],
    "name": "setMintPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient2",
        "type": "address"
      }
    ],
    "name": "setRoyaltyRecipient2",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Esquema para la cola de minteo (para acceso directo)
const mintQueueSchema = new mongoose.Schema({
  lazyId: { type: String, required: true },
  walletAddress: { type: String, required: true },
  metadataUrl: String,
  contractAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: String,
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
  email: String
});

// Índice único para evitar duplicados de lazyId+walletAddress
mintQueueSchema.index({ lazyId: 1, walletAddress: 1 }, { unique: true });

let MintQueue;
try {
  MintQueue = mongoose.model('MintQueue');
} catch (error) {
  MintQueue = mongoose.model('MintQueue', mintQueueSchema);
}

// Exportar el endpoint compatible con Vercel/Serverless
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    // Obtener todos los pendientes con contractAddress válido, ordenados por fecha (más reciente primero)
    const allPendings = await MintQueue.find({
      status: 'pending',
      contractAddress: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    // Filtrar para quedarnos solo con uno por combinación nftId+walletAddress
    const uniquePendings = [];
    const seen = new Set();
    for (const item of allPendings) {
      const key = item.nftId + ':' + item.walletAddress;
      if (!seen.has(key)) {
        uniquePendings.push(item);
        seen.add(key);
      } else {
        // Limpieza: elimina duplicados extra
        await MintQueue.deleteOne({ _id: item._id });
      }
    }
    // Ahora uniquePendings solo tiene uno por combinación

    // Obtener y marcar atómicamente un solo NFT listo para mintear
    const readyItem = await MintQueue.findOneAndUpdate(
      { status: 'pending' }, // CAMBIO: ahora busca 'pending'
      { $set: { status: 'processing' } },
      { sort: { createdAt: 1 }, new: true }
    ).lean();

    if (!readyItem) {
      return res.json({
        success: true,
        message: 'No hay NFTs pendientes para mintear'
      });
    }

    // Procesar solo ese item
    const result = await sendTransactionAtomic(readyItem);

    // Responder con el resultado
    res.json({
      success: true,
      message: 'Transacción enviada a la blockchain',
      item: result
    });

  } catch (error) {
    console.error('❌ Error en cron job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido'
    });
  }
};  

// Procesa un solo item de forma segura
async function sendTransactionAtomic(item) {
  const result = {};
  try {
    const provider = new ethers.providers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error('PRIVATE_KEY no está configurada en variables de entorno');
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractAddress = item.contractAddress;
    if (!contractAddress) throw new Error('No se encontró contractAddress en el registro de la cola. ¡Debe ser obligatorio!');
    const nftContract = new ethers.Contract(contractAddress, minABI, wallet);

    // Log informativo: metadataUrl es opcional
    if (!item.lazyId || !item.walletAddress) {
      console.error('❌ ERROR: Faltan campos obligatorios para mintear: lazyId o walletAddress:', item);
      throw new Error('Faltan campos obligatorios para mintear: lazyId o walletAddress');
    }
    console.log(`🔄 Enviando transacción para lazyId=${item.lazyId}, wallet=${item.walletAddress}, contractAddress=${contractAddress}`);
    if (item.metadataUrl) {
      console.log(`[info] metadataUrl presente: ${item.metadataUrl}`);
    }
    // Estimar gas
    try {
      // Usar lazyId en vez de metadataUrl
      const gasEstimate = await nftContract.estimateGas.mintForRecipient(
        item.lazyId,
        item.walletAddress
      );
      console.log(`⛽ Gas estimado: ${gasEstimate.toString()}`);
    } catch (gasError) {
      console.error('❌ Error estimando gas:', gasError);
      throw gasError;
    }
    // Enviar tx
    const tx = await nftContract.mintForRecipient(
      item.lazyId,
      item.walletAddress,
      { gasLimit: 500000 }
    );
    console.log(`✅ Transacción enviada con hash: ${tx.hash}`);
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
    result.walletAddress = item.walletAddress;
    result.metadataUrl = item.metadataUrl;
    result.transactionHash = tx.hash;
    result.status = 'sent';
  } catch (err) {
    await MintQueue.updateOne(
      { _id: item._id },
      {
        $set: {
          status: 'failed',
          errorMessage: err.message,
          processedAt: new Date()
        }
      }
    );
    result.walletAddress = item.walletAddress;
    result.metadataUrl = item.metadataUrl;
    result.error = err.message;
    result.status = 'failed';
  }
  return result;
}


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
    
    for (const item of pendingItems) {
      const contractAddress = item.contractAddress;
      if (!contractAddress) {
        console.error('[FATAL] Documento de la cola sin contractAddress:', item);
        results.push({ success: false, item, error: 'El documento de la cola no tiene contractAddress' });
        continue;
      }
      console.log('Contract Address usado para mintear:', contractAddress);
      const nftContract = new ethers.Contract(contractAddress, minABI, wallet);
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

// Exportar la función principal
