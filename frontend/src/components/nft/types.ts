/**
 * Tipos para el sistema de NFTs
 */

// Interfaz para nuestros NFTs
export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  priceWei?: string;
  tokenId: string;
  contractAddress: string;
  owner?: string;
  tokenURI?: string;
}

// Configuraciones
export const DEBUG_LOGS = true; // Establecer a true para logs detallados
export const ADMIN_ADDRESS = "0x7B327319bcE35183C50fCbE05c3f5112dE4076Ea"; // Dirección del administrador

// Utilidades para NFTs
export const getEurPrice = (price: string): number => {
  // Convertir de MATIC a EUR (aproximadamente 1 MATIC = 1.30 EUR)
  return Math.round(parseFloat(price) * 130);
};

// Formatear dirección wallet para mostrar
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(38)}`;
};
