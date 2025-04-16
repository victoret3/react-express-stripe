import { ethers } from 'ethers';
import { NETWORK_RPC_URL, NETWORKS, ACTIVE_NETWORK } from '../config/network';

// ABI del contrato - generado a partir del contrato Solidity
export const NFT_CONTRACT_ABI = [
  // Funciones de lectura
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getPrice(uint256 tokenId) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  
  // Funciones de escritura
  "function createNFT(address to, string memory uri, uint256 tokenPrice) returns (uint256)",
  "function setPrice(uint256 newPrice)",
  "function setTokenPrice(uint256 tokenId, uint256 tokenPrice)",
  "function buyNFT(uint256 tokenId) payable",
  
  // Eventos
  "event NFTCreated(uint256 tokenId, string tokenURI, uint256 price)",
  "event NFTSold(uint256 tokenId, address buyer, uint256 price)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Dirección del contrato en Arbitrum Sepolia
export const NFT_CONTRACT_ADDRESS = "0x645d6275f29e56670aedfcc6d00bd04be238e133"; // Dirección del contrato desplegado

// Utilidad para esperar un tiempo determinado
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Crea un proveedor con reintentos y rotación de RPCs
 * @returns Provider de Ethereum
 */
export const createProviderWithRetry = async () => {
  const maxRetries = 5;
  let lastError = null;
  const rpcUrls = ACTIVE_NETWORK.rpcUrls;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (let i = 0; i < rpcUrls.length; i++) {
      const rpcUrl = rpcUrls[i];
      try {
        console.log(`Intento ${attempt+1}/${maxRetries} - Conectando a RPC: ${rpcUrl}`);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Verificar que el proveedor esté funcionando correctamente
        const network = await provider.getNetwork();
        console.log(`Conexión exitosa a la red: ${network.name} (${network.chainId})`);
        
        // Verificar que estamos en la red correcta
        if (parseInt(ACTIVE_NETWORK.chainId, 16) !== network.chainId) {
          throw new Error(`Red incorrecta: esperada ${ACTIVE_NETWORK.chainName}, conectado a ${network.name} (${network.chainId})`);
        }
        
        return provider;
      } catch (error: any) {
        console.warn(`Error al conectar con RPC ${rpcUrl}:`, error.message);
        lastError = error;
        
        // Si es error de límite de tasa (429), esperar un poco más
        if (error.message.includes('429') || error.code === -32603) {
          console.warn('Límite de tasa alcanzado, esperando antes de reintentar...');
          // Esperar un tiempo exponencial entre reintentos (300ms, 600ms, 1200ms, etc.)
          await sleep(300 * Math.pow(2, attempt));
        }
      }
    }
    
    // Si hemos intentado con todos los RPCs y ninguno funcionó, esperar antes de reintentar
    const waitTime = Math.min(1000 * Math.pow(2, attempt), 15000); // Máximo 15 segundos de espera
    console.warn(`Todos los RPCs fallaron en el intento ${attempt+1}/${maxRetries}. Esperando ${waitTime}ms antes de reintentar...`);
    await sleep(waitTime);
  }
  
  console.error('Todos los intentos de conexión fallaron');
  throw lastError || new Error('No se pudo conectar a ningún RPC después de múltiples intentos');
};

/**
 * Conecta con el contrato de NFT con manejo mejorado de errores
 * @param provider Proveedor de Ethereum (opcional)
 * @param signer Firmante para transacciones (opcional)
 * @returns Instancia del contrato
 */
export const getNFTContract = async (provider?: ethers.providers.Provider, signer?: ethers.Signer) => {
  if (!provider) {
    try {
      // Usar provider con reintentos si no se proporciona uno
      provider = await createProviderWithRetry();
    } catch (error) {
      console.error('Error creando el proveedor:', error);
      throw new Error('No se pudo conectar a la red blockchain. Por favor, inténtelo de nuevo más tarde.');
    }
  }
  
  const contract = new ethers.Contract(
    NFT_CONTRACT_ADDRESS,
    NFT_CONTRACT_ABI,
    signer || provider
  );
  
  return contract;
};

/**
 * Convierte URLs de IPFS a URLs HTTP accesibles con múltiples gateways
 * @param ipfsUrl URL de IPFS (ipfs://...)
 * @returns URL HTTP accesible
 */
export const convertIpfsUrl = (ipfsUrl: string) => {
  if (!ipfsUrl) return '';
  
  if (ipfsUrl.startsWith('ipfs://')) {
    // Usar múltiples gateways para mayor resistencia
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
    ];
    
    // Seleccionar un gateway aleatorio
    const randomGateway = gateways[Math.floor(Math.random() * gateways.length)];
    return ipfsUrl.replace('ipfs://', randomGateway);
  }
  
  return ipfsUrl;
};

/**
 * Obtiene todos los NFT disponibles en el contrato con reintentos
 * @param forceRefresh Forzar actualización ignorando caché
 */
export const getAllNFTs = async (forceRefresh = false) => {
  // Implementar caché simple para reducir llamadas a la blockchain
  const cacheKey = 'all_nfts_cache';
  const cacheTime = 5 * 60 * 1000; // 5 minutos
  
  // Comprobar caché si no se fuerza actualización
  if (!forceRefresh) {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheTime) {
          console.log('Usando datos NFT en caché');
          return data;
        }
      } catch (e) {
        console.warn('Error al leer caché NFT:', e);
      }
    }
  }
  
  // Reintentos para obtener todos los NFTs
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const provider = await createProviderWithRetry();
      const contract = await getNFTContract(provider);
      
      console.log('Obteniendo totalSupply de NFTs...');
      const totalSupply = await contract.totalSupply();
      console.log(`Total de NFTs encontrados: ${totalSupply.toNumber()}`);
      
      const nfts = [];
      
      // Para grandes colecciones, podríamos implementar paginación
      const batchSize = 10;
      
      for (let i = 0; i < totalSupply.toNumber(); i++) {
        try {
          const tokenId = await contract.tokenByIndex(i);
          const tokenURI = await contract.tokenURI(tokenId);
          const owner = await contract.ownerOf(tokenId);
          const price = await contract.getPrice(tokenId);
          
          // Obtener metadata
          let metadata = {
            name: `NFT #${tokenId}`,
            description: "",
            image: ""
          };
          
          try {
            const ipfsUrl = convertIpfsUrl(tokenURI);
            const response = await fetch(ipfsUrl);
            if (!response.ok) {
              throw new Error(`Error fetching metadata: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            metadata = {
              ...metadata,
              ...data
            };
            
            // Convertir IPFS URL de la imagen si es necesario
            if (metadata.image) {
              metadata.image = convertIpfsUrl(metadata.image);
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
          }
          
          nfts.push({
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            owner,
            price: ethers.utils.formatEther(price),
            priceWei: price.toString(),
            contractAddress: NFT_CONTRACT_ADDRESS
          });
          
          // Cada cierto número de NFTs procesados, actualizar caché parcial
          if (i > 0 && i % batchSize === 0) {
            localStorage.setItem(cacheKey, JSON.stringify({
              timestamp: Date.now(),
              data: nfts
            }));
            console.log(`Procesados ${i}/${totalSupply.toNumber()} NFTs, caché actualizada`);
          }
        } catch (itemError) {
          console.error(`Error procesando NFT #${i}:`, itemError);
          // Continuar con el siguiente NFT
        }
      }
      
      // Guardar en caché
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: nfts
      }));
      
      return nfts;
    } catch (error: any) {
      console.error(`Intento ${attempt+1}/${maxRetries} - Error obteniendo NFTs:`, error);
      lastError = error;
      
      // Comprobar si es un error de límite de tasa
      if (error.message.includes('429') || error.code === -32603) {
        console.warn('Límite de tasa alcanzado, esperando antes de reintentar...');
        await sleep(2000 * Math.pow(2, attempt)); // Espera exponencial
      } else {
        await sleep(1000); // Espera estándar para otros errores
      }
    }
  }
  
  console.error(`Error después de ${maxRetries} intentos:`, lastError);
  // Si tenemos datos en caché, aunque estén desactualizados, mostrarlos como fallback
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const { data } = JSON.parse(cachedData);
      console.warn('Usando datos en caché desactualizados como fallback');
      return data;
    } catch (e) {}
  }
  
  throw new Error('No se pudieron cargar los NFTs. Por favor, inténtelo de nuevo más tarde.');
};

/**
 * Obtiene la información de un NFT específico con reintentos
 * @param tokenId ID del token
 */
export const getNFTDetails = async (tokenId: string) => {
  // Implementar caché para detalles de NFT
  const cacheKey = `nft_details_${tokenId}`;
  const cacheTime = 5 * 60 * 1000; // 5 minutos
  
  // Comprobar caché
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const { timestamp, data } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheTime) {
        console.log(`Usando detalles en caché para NFT #${tokenId}`);
        return data;
      }
    } catch (e) {
      console.warn(`Error al leer caché para NFT #${tokenId}:`, e);
    }
  }
  
  // Reintentos para obtener detalles de NFT
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const provider = await createProviderWithRetry();
      const contract = await getNFTContract(provider);
      
      const tokenURI = await contract.tokenURI(tokenId);
      const owner = await contract.ownerOf(tokenId);
      const price = await contract.getPrice(tokenId);
      
      // Obtener metadata
      let metadata = {
        name: `NFT #${tokenId}`,
        description: "",
        image: ""
      };
      
      try {
        const ipfsUrl = convertIpfsUrl(tokenURI);
        const response = await fetch(ipfsUrl);
        if (!response.ok) {
          throw new Error(`Error fetching metadata: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        metadata = {
          ...metadata,
          ...data
        };
        
        // Convertir IPFS URL de la imagen si es necesario
        if (metadata.image) {
          metadata.image = convertIpfsUrl(metadata.image);
        }
      } catch (error) {
        console.error(`Error fetching metadata for token ${tokenId}:`, error);
      }
      
      const nftDetails = {
        id: tokenId.toString(),
        tokenId: tokenId.toString(),
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        owner,
        price: ethers.utils.formatEther(price),
        priceWei: price.toString(),
        contractAddress: NFT_CONTRACT_ADDRESS,
        tokenURI
      };
      
      // Guardar en caché
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: nftDetails
      }));
      
      return nftDetails;
    } catch (error: any) {
      console.error(`Intento ${attempt+1}/${maxRetries} - Error obteniendo detalles de NFT #${tokenId}:`, error);
      lastError = error;
      
      // Comprobar si es un error de límite de tasa
      if (error.message.includes('429') || error.code === -32603) {
        console.warn('Límite de tasa alcanzado, esperando antes de reintentar...');
        await sleep(2000 * Math.pow(2, attempt)); // Espera exponencial
      } else {
        await sleep(1000); // Espera estándar para otros errores
      }
    }
  }
  
  console.error(`Error después de ${maxRetries} intentos:`, lastError);
  throw new Error(`No se pudieron cargar los detalles del NFT #${tokenId}. Por favor, inténtelo de nuevo más tarde.`);
};

/**
 * Crea un nuevo NFT en el contrato con manejo mejorado de errores
 * @param to Dirección del destinatario inicial
 * @param uri URI del metadata del NFT
 * @param price Precio del NFT en ETH
 * @param signer Firmante para la transacción
 */
export const createNFT = async (
  to: string,
  uri: string,
  price: string,
  signer: ethers.Signer
) => {
  try {
    // Verificar que el signer esté en la red correcta
    const network = await signer.provider?.getNetwork();
    if (network && parseInt(ACTIVE_NETWORK.chainId, 16) !== network.chainId) {
      return {
        success: false,
        error: `Red incorrecta. Por favor, cambie a ${ACTIVE_NETWORK.chainName}.`
      };
    }
    
    const contract = await getNFTContract(undefined, signer);
    const priceWei = ethers.utils.parseEther(price);
    
    console.log(`Creando NFT para ${to} con metadata ${uri} y precio ${price} ETH`);
    const tx = await contract.createNFT(to, uri, priceWei);
    console.log(`Transacción enviada: ${tx.hash}, esperando confirmación...`);
    
    const receipt = await tx.wait();
    console.log(`Transacción confirmada: ${receipt.transactionHash}`);
    
    // Buscar el evento NFTCreated para obtener el tokenId
    const event = receipt.events?.find((e: any) => e.event === 'NFTCreated');
    const tokenId = event?.args?.tokenId;
    
    // Invalidar caché de NFTs
    localStorage.removeItem('all_nfts_cache');
    localStorage.removeItem(`nfts_by_owner_${to.toLowerCase()}`);
    
    return {
      success: true,
      tokenId: tokenId?.toString(),
      transactionHash: receipt.transactionHash
    };
  } catch (error: any) {
    console.error("Error creating NFT:", error);
    
    // Mejorar mensajes de error para el usuario
    let errorMessage = 'Error desconocido';
    
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transacción rechazada por el usuario';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Fondos insuficientes para completar la transacción';
    } else if (error.message.includes('429') || error.code === -32603) {
      errorMessage = 'La red blockchain está congestionada. Por favor, inténtelo de nuevo más tarde.';
    } else {
      errorMessage = error.message || 'Error desconocido';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Compra un NFT del contrato con manejo mejorado de errores
 * @param tokenId ID del token a comprar
 * @param price Precio a pagar (en ETH)
 * @param signer Firmante para la transacción
 */
export const buyNFT = async (
  tokenId: string,
  price: string,
  signer: ethers.Signer
) => {
  try {
    // Verificar que el signer esté en la red correcta
    const network = await signer.provider?.getNetwork();
    if (network && parseInt(ACTIVE_NETWORK.chainId, 16) !== network.chainId) {
      return {
        success: false,
        error: `Red incorrecta. Por favor, cambie a ${ACTIVE_NETWORK.chainName}.`
      };
    }
    
    const contract = await getNFTContract(undefined, signer);
    const priceWei = ethers.utils.parseEther(price);
    
    console.log(`Comprando NFT #${tokenId} por ${price} ETH`);
    const tx = await contract.buyNFT(tokenId, { value: priceWei });
    console.log(`Transacción enviada: ${tx.hash}, esperando confirmación...`);
    
    const receipt = await tx.wait();
    console.log(`Transacción confirmada: ${receipt.transactionHash}`);
    
    // Invalidar caché de NFTs
    localStorage.removeItem('all_nfts_cache');
    localStorage.removeItem(`nft_details_${tokenId}`);
    
    // Obtener dirección del comprador para invalidar su caché
    const address = await signer.getAddress();
    localStorage.removeItem(`nfts_by_owner_${address.toLowerCase()}`);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error: any) {
    console.error(`Error buying NFT ${tokenId}:`, error);
    
    // Mejorar mensajes de error para el usuario
    let errorMessage = 'Error desconocido';
    
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transacción rechazada por el usuario';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Fondos insuficientes para completar la transacción';
    } else if (error.message.includes('429') || error.code === -32603) {
      errorMessage = 'La red blockchain está congestionada. Por favor, inténtelo de nuevo más tarde.';
    } else {
      errorMessage = error.message || 'Error desconocido';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Obtiene los NFTs propiedad de una dirección específica con reintentos
 * @param ownerAddress Dirección del propietario
 */
export const getNFTsByOwner = async (ownerAddress: string) => {
  if (!ownerAddress) {
    return [];
  }
  
  // Normalizar dirección
  ownerAddress = ownerAddress.toLowerCase();
  
  // Implementar caché para NFTs por propietario
  const cacheKey = `nfts_by_owner_${ownerAddress}`;
  const cacheTime = 5 * 60 * 1000; // 5 minutos
  
  // Comprobar caché
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const { timestamp, data } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheTime) {
        console.log(`Usando NFTs en caché para propietario ${ownerAddress}`);
        return data;
      }
    } catch (e) {
      console.warn(`Error al leer caché para propietario ${ownerAddress}:`, e);
    }
  }
  
  // Reintentos para obtener NFTs por propietario
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const provider = await createProviderWithRetry();
      const contract = await getNFTContract(provider);
      
      console.log(`Obteniendo balance de NFTs para ${ownerAddress}...`);
      const balance = await contract.balanceOf(ownerAddress);
      console.log(`${ownerAddress} tiene ${balance.toNumber()} NFTs`);
      
      const nfts = [];
      
      for (let i = 0; i < balance.toNumber(); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
          const tokenURI = await contract.tokenURI(tokenId);
          const price = await contract.getPrice(tokenId);
          
          // Obtener metadata
          let metadata = {
            name: `NFT #${tokenId}`,
            description: "",
            image: ""
          };
          
          try {
            const ipfsUrl = convertIpfsUrl(tokenURI);
            const response = await fetch(ipfsUrl);
            if (!response.ok) {
              throw new Error(`Error fetching metadata: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            metadata = {
              ...metadata,
              ...data
            };
            
            // Convertir IPFS URL de la imagen si es necesario
            if (metadata.image) {
              metadata.image = convertIpfsUrl(metadata.image);
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
          }
          
          nfts.push({
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            owner: ownerAddress,
            price: ethers.utils.formatEther(price),
            priceWei: price.toString(),
            contractAddress: NFT_CONTRACT_ADDRESS
          });
        } catch (itemError) {
          console.error(`Error procesando NFT #${i} para propietario ${ownerAddress}:`, itemError);
          // Continuar con el siguiente NFT
        }
      }
      
      // Guardar en caché
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: nfts
      }));
      
      return nfts;
    } catch (error: any) {
      console.error(`Intento ${attempt+1}/${maxRetries} - Error obteniendo NFTs para propietario ${ownerAddress}:`, error);
      lastError = error;
      
      // Comprobar si es un error de límite de tasa
      if (error.message.includes('429') || error.code === -32603) {
        console.warn('Límite de tasa alcanzado, esperando antes de reintentar...');
        await sleep(2000 * Math.pow(2, attempt)); // Espera exponencial
      } else {
        await sleep(1000); // Espera estándar para otros errores
      }
    }
  }
  
  console.error(`Error después de ${maxRetries} intentos:`, lastError);
  // Usar caché desactualizada como fallback si existe
  const outdatedCache = localStorage.getItem(cacheKey);
  if (outdatedCache) {
    try {
      const { data } = JSON.parse(outdatedCache);
      console.warn('Usando datos en caché desactualizados como fallback');
      return data;
    } catch (e) {}
  }
  
  return [];
};
