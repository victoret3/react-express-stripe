// Direcciones de los contratos desplegados
export const COLLECTION_FACTORY_ADDRESS = "0xd115612a3308FfAf388200778Ef787E607bcA90B"; // Dirección del contrato factory desplegado en Arbitrum Sepolia
export const NFT_CONTRACT_ADDRESS = "0x436492DBc2E30E56FaC8F2297BD1964833c0687d";

// Configuración de IPFS
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const IPFS_API_URL = "https://api.nft.storage";

// Otras constantes
export const DEFAULT_GAS_LIMIT = 500000;
export const DEFAULT_GAS_PRICE = "1000000000"; // 1 gwei 

// Configuración de la red
export const NETWORK_CONFIG = {
  chainId: "421614", // Arbitrum Sepolia
  chainName: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: [
    "https://sepolia-rollup.arbitrum.io/rpc",             // RPC oficial (principal, más estable)
    "https://arbitrum-sepolia.publicnode.com",            // Public Node (con límites más altos)
    "https://arb-sepolia.g.alchemy.com/v2/demo",          // Alchemy demo para pruebas
    "https://arbitrum-sepolia.blockpi.network/v1/rpc/public"  // Blockpi como último recurso
  ],
  blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
}; 

// Configuración para manejo de errores RPC
export const RPC_CONFIG = {
  MAX_RETRIES: 5,                // Incrementar el número máximo de reintentos 
  INITIAL_DELAY: 2000,           // Aumentar el retraso inicial antes del primer reintento (milisegundos)
  MAX_DELAY: 20000,              // Incrementar el retraso máximo entre reintentos (milisegundos)
  BACKOFF_FACTOR: 2,             // Factor para incremento exponencial del tiempo de espera
  CACHE_TTL: 10 * 60 * 1000,     // Aumentar el tiempo de vida del caché a 10 minutos
  REQUEST_TIMEOUT: 10000         // Timeout de 10 segundos por solicitud
}; 