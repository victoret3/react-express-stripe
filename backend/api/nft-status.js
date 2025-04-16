// Importar dependencias
const Stripe = require('stripe');
const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();

// Configurar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Función principal que maneja las solicitudes
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder a solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener el sessionId de la URL
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Se requiere el parámetro sessionId' });
    }

    console.log(`Verificando estado del NFT para sesión: ${sessionId}`);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Verificar el estado del pago
    const paymentStatus = session.payment_status;

    // Verificar si la sesión es de tipo NFT
    const metadata = session.metadata || {};
    const isNFT = metadata.type === 'lazy_mint' || metadata.type === 'nft';
    
    // Si no es un NFT, retornar error
    if (!isNFT) {
      return res.status(400).json({ 
        error: 'Esta sesión no corresponde a un NFT',
        sessionType: metadata.type || 'desconocido'
      });
    }

    // Obtener el ID del NFT
    const nftId = metadata.nftId || metadata.lazyId || metadata.token_id || null;
    
    // Estado del NFT
    const nftStatus = metadata.nft_status || 'pending';
    const alreadyMinted = metadata.nft_minted === 'true';
    const txHash = metadata.transaction_hash || null;
    const mintedAt = metadata.minted_at || null;
    const isSimulation = metadata.is_simulation === 'true';

    // Construir respuesta
    const response = {
      sessionId,
      nftId,
      paymentStatus,
      nftStatus,
      customerEmail: session.customer_email,
      amount: session.amount_total / 100, // Convertir de céntimos a euros
      currency: session.currency,
      minteado: alreadyMinted,
      listo_para_mintear: nftStatus === 'ready_to_mint' && paymentStatus === 'paid' && !alreadyMinted,
      transactionHash: txHash,
      mintedAt,
      isSimulation,
      metadata
    };

    // Agregar información extra para depuración
    console.log(`NFT status para sesión ${sessionId}:`, {
      nftId,
      paymentStatus,
      nftStatus,
      minteado: alreadyMinted
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error al verificar estado del NFT:', error);
    return res.status(500).json({ 
      error: 'Error al obtener información del NFT',
      details: error.message
    });
  }
};

// Endpoint para verificar el estado de una transacción de minteo NFT
router.get('/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    // Validar el hash de la transacción
    if (!txHash || txHash.length !== 66 || !txHash.startsWith('0x')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hash de transacción inválido' 
      });
    }
    
    console.log(`🔍 Verificando estado de transacción: ${txHash}`);
    
    // Configurar provider
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
    );
    
    // Obtener información de la transacción
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transacción no encontrada' 
      });
    }
    
    // Verificar si la transacción ha sido incluida en un bloque
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.json({
        success: true,
        status: 'pending',
        txHash,
        confirmations: tx.confirmations,
        message: 'La transacción está pendiente de confirmación'
      });
    }
    
    // Verificar si la transacción fue exitosa
    if (receipt.status === 1) {
      return res.json({
        success: true,
        status: 'confirmed',
        txHash,
        blockNumber: receipt.blockNumber,
        confirmations: tx.confirmations,
        gasUsed: receipt.gasUsed.toString(),
        message: 'NFT minteado con éxito'
      });
    } else {
      return res.json({
        success: false,
        status: 'failed',
        txHash,
        blockNumber: receipt.blockNumber,
        message: 'La transacción falló durante la ejecución'
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado de transacción:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para verificar NFTs minteados para una dirección específica
router.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validar la dirección
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dirección de wallet inválida' 
      });
    }
    
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    if (!contractAddress) {
      return res.status(500).json({ 
        success: false, 
        error: 'Dirección del contrato no configurada en el servidor' 
      });
    }
    
    console.log(`🔍 Verificando NFTs para wallet: ${address}`);
    
    // Configurar provider
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
    );
    
    // ABI mínimo para obtener balance y tokenURI
    const minABI = [
      "function balanceOf(address owner) external view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      "function tokenURI(uint256 tokenId) external view returns (string)"
    ];
    
    // Crear instancia del contrato
    const nftContract = new ethers.Contract(contractAddress, minABI, provider);
    
    // Obtener balance de NFTs del usuario
    const balance = await nftContract.balanceOf(address);
    console.log(`📊 Balance de NFTs: ${balance.toString()}`);
    
    // Si no tiene NFTs, retornar lista vacía
    if (balance.eq(0)) {
      return res.json({
        success: true,
        address,
        nfts: []
      });
    }
    
    // Obtener los IDs de todos los NFTs del usuario
    const nfts = [];
    for (let i = 0; i < balance; i++) {
      try {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        const tokenURI = await nftContract.tokenURI(tokenId);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI
        });
      } catch (err) {
        console.error(`Error obteniendo NFT #${i}:`, err.message);
      }
    }
    
    return res.json({
      success: true,
      address,
      count: nfts.length,
      nfts
    });
    
  } catch (error) {
    console.error('❌ Error verificando NFTs de la wallet:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 