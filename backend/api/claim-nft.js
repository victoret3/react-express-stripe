// Importar dependencias
const Stripe = require('stripe');
const { ethers } = require('ethers');
require('dotenv').config();

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurar proveedor de Ethereum
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo');

// Configurar cartera para mintear NFTs
let wallet;
const SIMULATION_MODE = !process.env.MINTER_PRIVATE_KEY;

if (process.env.MINTER_PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, provider);
  console.log('Cartera configurada para mintear NFTs');
} else {
  console.log('ADVERTENCIA: Clave privada no configurada, se utilizará modo simulación');
  // Usar una cartera aleatoria para simulación
  wallet = ethers.Wallet.createRandom().connect(provider);
}

// Configurar contrato NFT
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;

// ABI simplificado para mintear
const NFT_ABI = [
  "function mint(address to, uint256 tokenId) public returns (bool)",
  "function safeMint(address to, uint256 tokenId) public returns (bool)",
  "function mintNFT(address to, uint256 tokenId) public returns (bool)"
];

// Función para mintear un NFT real
async function mintNFT(toAddress, tokenId, sessionId) {
  try {
    console.log(`Minteando NFT real: Token ID ${tokenId} para ${toAddress}`);
    
    // Conectar al contrato
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, wallet);
    
    // Intentar diferentes métodos de minteo según el contrato
    let tx;
    try {
      // Probar primero con mintNFT si existe
      tx = await nftContract.mintNFT(toAddress, tokenId);
    } catch (e) {
      try {
        // Probar con safeMint si mintNFT falla
        tx = await nftContract.safeMint(toAddress, tokenId);
      } catch (e) {
        // Usar mint como último recurso
        tx = await nftContract.mint(toAddress, tokenId);
      }
    }
    
    // Esperar a que la transacción sea minada
    const receipt = await tx.wait();
    console.log(`Transacción completada: ${receipt.transactionHash}`);
    
    // Actualizar metadatos en la sesión de Stripe
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        nft_minted: 'true',
        transaction_hash: receipt.transactionHash,
        minted_at: new Date().toISOString(),
        is_simulation: 'false'
      }
    });
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Error al mintear NFT:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para simular minteo cuando no hay clave privada
async function simulateMintNFT(toAddress, tokenId, sessionId) {
  try {
    console.log(`Simulando minteo de NFT: Token ID ${tokenId} para ${toAddress}`);
    
    // Crear un hash ficticio para simular
    const fakeTxHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Simular retraso de la red
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Actualizar metadatos en la sesión de Stripe
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        nft_minted: 'true',
        transaction_hash: fakeTxHash,
        minted_at: new Date().toISOString(),
        is_simulation: 'true'
      }
    });
    
    return {
      success: true,
      transactionHash: fakeTxHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      isSimulation: true
    };
  } catch (error) {
    console.error('Error al simular minteo de NFT:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función principal
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Responder a solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { sessionId, walletAddress } = req.body;

    // Validar parámetros requeridos
    if (!sessionId || !walletAddress) {
      return res.status(400).json({
        error: 'Parámetros incompletos',
        requiredParams: ['sessionId', 'walletAddress']
      });
    }

    // Validar dirección de cartera
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Dirección de cartera inválida',
        address: walletAddress
      });
    }

    console.log(`Procesando solicitud de minteo para sesión ${sessionId}`);

    // Obtener detalles de la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verificar que la sesión exista y el pago esté completo
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'El pago de esta sesión no está completado',
        status: session.payment_status
      });
    }

    // Verificar que la sesión corresponda a un NFT
    const metadata = session.metadata || {};
    if (metadata.type !== 'lazy_mint' && metadata.type !== 'nft') {
      return res.status(400).json({
        error: 'Esta sesión no corresponde a un NFT',
        type: metadata.type || 'desconocido'
      });
    }

    // Verificar si ya fue minteado
    if (metadata.nft_minted === 'true') {
      return res.status(200).json({
        success: true,
        status: 'already_minted',
        message: 'Este NFT ya ha sido minteado',
        transactionHash: metadata.transaction_hash,
        mintedAt: metadata.minted_at,
        isSimulation: metadata.is_simulation === 'true'
      });
    }

    // Obtener token ID
    const tokenId = metadata.token_id || metadata.nftId || metadata.lazyId;
    if (!tokenId) {
      return res.status(400).json({
        error: 'No se encontró un ID de token válido en la sesión'
      });
    }

    // Mintear el NFT o simular el minteo
    let mintResult;
    if (SIMULATION_MODE) {
      mintResult = await simulateMintNFT(walletAddress, tokenId, sessionId);
    } else {
      mintResult = await mintNFT(walletAddress, tokenId, sessionId);
    }

    if (mintResult.success) {
      return res.status(200).json({
        success: true,
        message: SIMULATION_MODE ? 'NFT simulado con éxito' : 'NFT minteado con éxito',
        transactionHash: mintResult.transactionHash,
        blockNumber: mintResult.blockNumber,
        tokenId: tokenId,
        isSimulation: SIMULATION_MODE
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Error al mintear el NFT',
        details: mintResult.error
      });
    }
  } catch (error) {
    console.error('Error en el endpoint de reclamar NFT:', error);
    res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
};