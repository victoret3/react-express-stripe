import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// ABI reducido para interactuar con funciones básicas de ERC721
const ERC721_ABI = [
  // Funciones de consulta
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Funciones de transferencia
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  
  // Eventos
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

class ManifoldService {
  constructor() {
    // Validar que las variables de entorno existan
    if (!process.env.MANIFOLD_CONTRACT_ADDRESS) {
      console.error("⚠️ La dirección del contrato no está definida en .env");
    }
    
    if (!process.env.MINTER_PRIVATE_KEY) {
      console.error("⚠️ La clave privada del minteador no está definida en .env");
    }
    
    if (!process.env.RPC_URL) {
      console.error("⚠️ La URL del RPC no está definida en .env");
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.signer = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.MANIFOLD_CONTRACT_ADDRESS,
      ERC721_ABI,
      this.signer
    );
  }
  
  // Obtener información de un token
  async getTokenInfo(tokenId) {
    try {
      const owner = await this.contract.ownerOf(tokenId);
      const tokenURI = await this.contract.tokenURI(tokenId);
      
      return {
        tokenId,
        owner,
        tokenURI
      };
    } catch (error) {
      console.error(`Error al obtener información del token ${tokenId}:`, error);
      throw error;
    }
  }
  
  // Transferir un token
  async transferToken(tokenId, toAddress) {
    try {
      // Valida que la dirección sea válida
      if (!ethers.utils.isAddress(toAddress)) {
        throw new Error(`La dirección ${toAddress} no es válida`);
      }
      
      // La dirección del remitente es la del signer (nuestra wallet)
      const fromAddress = this.signer.address;
      
      console.log(`Transferencia de token ${tokenId} desde ${fromAddress} a ${toAddress}`);
      
      // Transferir el token
      const tx = await this.contract.safeTransferFrom(fromAddress, toAddress, tokenId);
      
      // Esperar a que se confirme la transacción
      const receipt = await tx.wait();
      
      console.log(`✅ Token transferido. TX Hash: ${receipt.transactionHash}`);
      return {
        success: true,
        tokenId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Error al transferir el token ${tokenId}:`, error);
      throw error;
    }
  }
  
  // Verificar si somos dueños de un token
  async verifyTokenOwnership(tokenId) {
    try {
      const owner = await this.contract.ownerOf(tokenId);
      const isOwner = owner.toLowerCase() === this.signer.address.toLowerCase();
      
      return {
        tokenId,
        owner,
        isOwner
      };
    } catch (error) {
      console.error(`Error al verificar propiedad del token ${tokenId}:`, error);
      throw error;
    }
  }
}

export default new ManifoldService();
