/**
 * Configuración de direcciones de Smart Contracts
 * Este archivo centraliza todas las direcciones de contratos usadas en la aplicación
 */
// Import JSON data for each collection's frontend metadata

// Contratos de NFT Collections
export const NFT_COLLECTIONS = [
  {
    // Colección Kachitomio
    address: "0x94F91C7dC6Bad6885eEc45e8705c32577A719dD1", // Sustituye por la dirección real de tu contrato
    network: process.env.REACT_APP_NETWORK,
  }
];



// Función auxiliar para obtener un contrato por red
export function getContractsByNetwork(networkName: string) {
  return NFT_COLLECTIONS.filter(collection => 
    collection.network === networkName || !collection.network
  );
}

export default {
  NFT_COLLECTIONS,
  getContractsByNetwork
}; 