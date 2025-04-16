const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const mongoose = require('mongoose');

const router = express.Router();

// Middleware para procesar JSON
router.use(express.json());

// Configuración CORS
router.use(cors({
  origin: ['https://naniboron.web.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'stripe-signature']
}));

// ABI mínimo necesario para mintear
const NFT_ABI = [
  "function mint(address to, string memory tokenId) external returns (uint256)",
  "function mintTo(address to, string memory uri) external returns (uint256)"
];

// Endpoint para minteo forzado directo
router.post('/force', async (req, res) => {
  console.log('🔨 Solicitud de minteo directo recibida:', req.body);
  
  const { walletAddress, tokenId, metadataUrl } = req.body;
  
  // Validar datos
  if (!walletAddress || (!tokenId && !metadataUrl)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere dirección de wallet y tokenId o metadataUrl' 
    });
  }
  
  // Validar formato de wallet
  if (!ethers.utils.isAddress(walletAddress)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Dirección de wallet inválida' 
    });
  }
  
  try {
    // Configuración de la wallet y provider
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    const rpcUrl = process.env.RPC_URL || 'https://api.zan.top/arb-sepolia';
    
    // Validar que tenemos las variables necesarias
    if (!privateKey || !contractAddress) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuración incompleta en el servidor' 
      });
    }
    
    console.log(`🔌 Conectando a RPC: ${rpcUrl}`);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    console.log(`🔑 Preparando wallet para mint`);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`📄 Cargando contrato NFT: ${contractAddress}`);
    const nftContract = new ethers.Contract(contractAddress, NFT_ABI, wallet);
    
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
      console.log(`🆔 Usando tokenId: ${tokenId}`);
      method = 'mint';
      tx = await nftContract.mint(walletAddress, tokenId, { 
        gasLimit: 500000 
      });
    }
    
    console.log(`📤 Transacción enviada. Hash: ${tx.hash}, Método: ${method}`);
    
    // Devolver respuesta inmediata sin esperar confirmación
    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      message: 'Transacción de minteo iniciada correctamente'
    });
    
  } catch (error) {
    console.error('❌ ERROR AL MINTEAR NFT:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido al mintear NFT'
    });
  }
});

// Endpoint para simular minteo (sin interactuar con blockchain)
router.post('/simulate', (req, res) => {
  console.log('🔄 Simulación de minteo solicitada:', req.body);
  
  const { walletAddress, tokenId, metadataUrl } = req.body;
  
  // Validar datos básicos
  if (!walletAddress || (!tokenId && !metadataUrl)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Se requiere dirección de wallet y tokenId o metadataUrl' 
    });
  }
  
  // Validar formato de wallet
  if (!ethers.utils.isAddress(walletAddress)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Dirección de wallet inválida' 
    });
  }
  
  // Retornar éxito simulado
  return res.status(200).json({
    success: true,
    simulated: true,
    walletAddress,
    tokenId: tokenId || 'usando-metadata',
    metadataUrl: metadataUrl || 'no-usado',
    message: 'Simulación de minteo completada correctamente'
  });
});

module.exports = router; 