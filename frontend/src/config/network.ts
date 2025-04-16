/**
 * Configuración de red para blockchain
 */

// Configuración para diferentes redes
export const NETWORKS = {
  // Arbitrum Sepolia
  ARBITRUM_SEPOLIA: {
    chainId: "0x66eee", // 421614 en decimal
    chainName: "Arbitrum Sepolia",
    nativeCurrency: { 
      name: "ETH", 
      symbol: "ETH", 
      decimals: 18 
    },
    rpcUrls: [
      "https://sepolia-rollup.arbitrum.io/rpc",
      "https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
      "https://arbitrum-sepolia.publicnode.com"
    ],
    blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
  },
  
  // Polygon Mainnet
  POLYGON_MAINNET: {
    chainId: "0x89", // 137 en decimal
    chainName: "Polygon Mainnet",
    nativeCurrency: { 
      name: "MATIC", 
      symbol: "MATIC", 
      decimals: 18 
    },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"]
  },
  
  // Mumbai Testnet (Polygon)
  MUMBAI_TESTNET: {
    chainId: "0x13881", // 80001 en decimal
    chainName: "Mumbai Testnet",
    nativeCurrency: { 
      name: "MATIC", 
      symbol: "MATIC", 
      decimals: 18 
    },
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
  },
  
  // Amoy Testnet (Polygon)
  AMOY_TESTNET: {
    chainId: "0x13882", // 80002 en decimal
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: { 
      name: "MATIC", 
      symbol: "MATIC", 
      decimals: 18 
    },
    rpcUrls: [
      "https://polygon-amoy.public.blastapi.io",
      "https://polygon-amoy.blockpi.network/v1/rpc/public"
    ],
    blockExplorerUrls: ["https://www.oklink.com/amoy"]
  }
};

// Red activa (cambiar según el entorno)
export const ACTIVE_NETWORK = NETWORKS.ARBITRUM_SEPOLIA;

// Provider URL para la red actual
export const NETWORK_RPC_URL = ACTIVE_NETWORK.rpcUrls[0];

// Chain ID para la red actual
export const NETWORK_CHAIN_ID = ACTIVE_NETWORK.chainId;

// Faucet para obtener ETH de testnet
export const TESTNET_FAUCET_URL = "https://sepoliafaucet.com/";

/**
 * Solicita al usuario cambiar a la red correcta
 * @returns Promise que se resuelve cuando el usuario cambia a la red correcta
 */
export const switchToCorrectNetwork = async (): Promise<boolean> => {
  const { ethereum } = window as any;
  
  if (!ethereum) {
    console.error("MetaMask no está instalado");
    return false;
  }
  
  try {
    // Comprobar primero si ya estamos en la red correcta
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId === ACTIVE_NETWORK.chainId) {
        console.log('Ya estamos en la red correcta:', ACTIVE_NETWORK.chainName);
        return true;
      }
    } catch (checkError) {
      console.warn('Error al comprobar la red actual:', checkError);
    }
    
    // Envolver la solicitud en un timeout
    const switchPromise = ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ACTIVE_NETWORK.chainId }],
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Tiempo de espera agotado al cambiar de red")), 10000);
    });
    
    await Promise.race([switchPromise, timeoutPromise]);
    
    // Verificar que se cambió correctamente
    const newChainId = await ethereum.request({ method: 'eth_chainId' });
    if (newChainId === ACTIVE_NETWORK.chainId) {
      console.log('Red cambiada con éxito a:', ACTIVE_NETWORK.chainName);
      return true;
    } else {
      console.warn('La red no se cambió correctamente');
      return false;
    }
  } catch (error: any) {
    // Si el error es porque la red no está configurada (error 4902)
    if (error.code === 4902) {
      try {
        console.log('Red no configurada, intentando añadirla a MetaMask...');
        
        // Añadir la red a MetaMask con timeout
        const addNetworkPromise = ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ACTIVE_NETWORK.chainId,
              chainName: ACTIVE_NETWORK.chainName,
              nativeCurrency: ACTIVE_NETWORK.nativeCurrency,
              rpcUrls: ACTIVE_NETWORK.rpcUrls,
              blockExplorerUrls: ACTIVE_NETWORK.blockExplorerUrls,
            },
          ],
        });
        
        const addTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Tiempo de espera agotado al añadir red")), 15000);
        });
        
        await Promise.race([addNetworkPromise, addTimeoutPromise]);
        
        // Esperar un momento para que MetaMask procese el cambio
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar que estamos en la red correcta
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        if (chainId === ACTIVE_NETWORK.chainId) {
          console.log('Red añadida y cambiada con éxito');
          return true;
        } else {
          console.warn('La red se añadió pero no se cambió correctamente');
          return false;
        }
      } catch (addError) {
        console.error("Error añadiendo la red:", addError);
        return false;
      }
    } else if (error.message && error.message.includes("Tiempo de espera")) {
      console.error("Timeout al esperar confirmación de MetaMask:", error);
      return false;
    }
    
    console.error("Error cambiando de red:", error);
    return false;
  }
};