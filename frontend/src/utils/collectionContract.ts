import { ethers } from 'ethers';
import { NETWORK_RPC_URL, NETWORKS, ACTIVE_NETWORK } from '../config/network';
import { COLLECTION_FACTORY_ADDRESS, RPC_CONFIG } from './contracts';
import CollectionFactoryABI from '../abis/CollectionFactory.json';
import NFTCollectionABI from '../abis/NFTCollection.json';
import NaniBoronatNFTABI from '../abis/NaniBoronatNFT.json';
import { IPFS_GATEWAYS, cleanIpfsUrl } from './ipfs';
import { createStandaloneToast } from '@chakra-ui/react';
const { toast } = createStandaloneToast();


// Declaración para window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// Caché para reducir llamadas a la blockchain
const collectionsCache = {
  allCollections: null as CollectionInfo[] | null,
  ownerCollections: {} as Record<string, CollectionInfo[]>,
  nftsInCollection: {} as Record<string, CollectionNFT[]>,
  lastUpdated: 0,
  // Usar el tiempo de caché de la configuración
  TTL: RPC_CONFIG.CACHE_TTL
};

function isCacheValid() {
  return (Date.now() - collectionsCache.lastUpdated) < collectionsCache.TTL;
}

function updateCache() {
  collectionsCache.lastUpdated = Date.now();
}

// Array de URLs de RPC que se usarán como fallbacks
const RPC_URLS = [...ACTIVE_NETWORK.rpcUrls];
let currentRpcIndex = 0;
let consecutiveFailures = 0;
const MAX_RETRIES = RPC_CONFIG.MAX_RETRIES;
let lastRequestTime = 0;

// Función para obtener el siguiente RPC URL de forma rotativa
const getNextRpcUrl = () => {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
  console.log(`Cambiando a RPC alternativo: ${RPC_URLS[currentRpcIndex]}`);
  return RPC_URLS[currentRpcIndex];
}

// Función para asegurar un tiempo mínimo entre solicitudes
const throttleRequest = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // Asegurar al menos 1000ms entre solicitudes para evitar límites de tasa
  if (timeSinceLastRequest < 1000) {
    const waitTime = 1000 - timeSinceLastRequest;
    console.log(`Esperando ${waitTime}ms para evitar límites de tasa...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// Función para crear un provider con manejo de errores y retries
export const createProvider = async () => {
  // Verifica si hay una wallet conectada - SIEMPRE USAR LA WALLET SI ESTÁ DISPONIBLE
  if (window.ethereum) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      console.log("Red actual:", network.chainId);
      
      // Verifica si la red es Arbitrum Sepolia (chainId 421614)
      if (network.chainId !== 421614) {
        throw new Error("Por favor, conecta tu wallet a la red Arbitrum Sepolia");
      }
      
      // Usar siempre la wallet (MetaMask) como proveedor principal
      return provider;
    } catch (error) {
      console.error("Error al crear provider con web3:", error);
      throw new Error("Error con la wallet. Por favor, reconecta MetaMask y recarga la página.");
    }
  } else {
    // Si no hay wallet conectada, usar JSON RPC como fallback
    return createFallbackProvider();
  }
}

// Crear un provider de fallback usando las URLs de RPC configuradas
const createFallbackProvider = () => {
  // Usa la URL de RPC actual
  const rpcUrl = RPC_URLS[currentRpcIndex];
  console.log(`Usando RPC: ${rpcUrl}`);
  
  // Crear provider con timeout
  const provider = new ethers.providers.JsonRpcProvider({
    url: rpcUrl,
    timeout: RPC_CONFIG.REQUEST_TIMEOUT
  });
  
  return provider;
}

// Función para ejecutar una llamada con retries automáticos
export const executeWithRetry = async (operation: (provider: ethers.providers.Provider, ...args: any[]) => Promise<any>, args: any[] = []) => {
  let retries = 0;
  
  try {
    // Intentar obtener provider (preferentemente de la wallet)
    const provider = await createProvider();
    return await operation(provider, ...args);
  } catch (error) {
    console.error("Error ejecutando operación:", error);
    throw error;
  }
}

// Obtener la instancia del contrato factory
export const getFactoryContract = async (withSignerOrProvider: boolean | ethers.providers.Provider = false) => {
  return executeWithRetry(async (provider) => {
    // Si withSignerOrProvider es un provider, úsalo; de lo contrario usa el provider del parámetro
    const providerToUse = (typeof withSignerOrProvider === 'boolean' || withSignerOrProvider === undefined) 
      ? provider 
      : withSignerOrProvider;
    
    const contract = new ethers.Contract(
      COLLECTION_FACTORY_ADDRESS,
      CollectionFactoryABI.abi,
      providerToUse
    );
    
    // Si withSignerOrProvider es true (boolean), conecta con signer
    if (typeof withSignerOrProvider === 'boolean' && withSignerOrProvider) {
      // Convertir a Web3Provider que tiene getSigner
      if ('getSigner' in provider) {
        const web3Provider = provider as ethers.providers.Web3Provider;
        const signer = web3Provider.getSigner();
        return contract.connect(signer);
      } else {
        throw new Error("No se pudo obtener el signer. Por favor, conecta tu wallet.");
      }
    }
    
    return contract;
  });
}

// Obtener la instancia de un contrato de colección
export const getCollectionContract = async (contractAddressOrNeedSigner: string | boolean = false) => {
  try {
    // Distinguir entre llamadas con dirección y llamadas con needSigner
    let needSigner = false;
    let contractAddress = COLLECTION_FACTORY_ADDRESS;
    
    if (typeof contractAddressOrNeedSigner === 'boolean') {
      needSigner = contractAddressOrNeedSigner;
    } else if (typeof contractAddressOrNeedSigner === 'string') {
      contractAddress = contractAddressOrNeedSigner;
    }
    
    // Crear provider y obtener signer si es necesario
    const provider = await createProvider();
    let providerOrSigner: ethers.providers.Provider | ethers.Signer = provider;
    
    if (needSigner) {
      if ('getSigner' in provider) {
        const web3Provider = provider as ethers.providers.Web3Provider;
        providerOrSigner = web3Provider.getSigner();
      }
    }
    
    // Seleccionar el ABI adecuado según la dirección del contrato
    const abi = contractAddress === COLLECTION_FACTORY_ADDRESS 
      ? CollectionFactoryABI.abi 
      : NFT_COLLECTION_ABI;
    
    const contract = new ethers.Contract(
      contractAddress, 
      abi, 
      providerOrSigner
    );
    return contract;
  } catch (error) {
    console.error('Error al obtener contrato de colecciones:', error);
    toast({
      title: 'Error al conectar con el contrato',
      description: 'No se pudo obtener el contrato de colecciones',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    throw error;
  }
};

// Funciones específicas del contrato factory
export const getUserCollections = async (userAddress: string) => {
  return executeWithRetry(async () => {
    const contract = await getFactoryContract();
    return contract.getUserCollections(userAddress);
  });
}

export const createCollection = async (
  name: string, 
  symbol: string, 
  description: string, 
  imageURI: string
) => {
  return executeWithRetry(async () => {
    const contract = await getFactoryContract(true);
    const tx = await contract.createCollection(name, symbol, description, imageURI, {
      gasLimit: 3000000 // Aumenta el límite de gas para creación
    });
    return {
      success: true,
      transactionHash: tx.hash,
      receipt: await tx.wait()
    };
  }).catch(error => {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  });
}

// ABI del contrato Factory
export const COLLECTION_FACTORY_ABI = [
  // Funciones de lectura
  "function getTotalCollections() view returns (uint256)",
  "function getAllCollections() view returns (tuple(address collectionAddress, string name, string symbol, string description, string imageCid, address owner, uint256 timestamp)[])",
  "function getCollectionsByOwner(address owner) view returns (address[])",
  "function getCollectionInfo(uint256 index) view returns (tuple(address collectionAddress, string name, string symbol, string description, string imageCid, address owner, uint256 timestamp))",
  
  // Funciones de escritura
  "function createCollection(string memory name, string memory symbol, string memory description, string memory imageCid) returns (address)",
  
  // Eventos
  "event CollectionCreated(address collectionAddress, string name, string symbol, string description, string imageCid)"
];

// ABI del contrato de Colección
export const NFT_COLLECTION_ABI = [
  // Funciones de lectura
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function description() view returns (string)",
  "function image() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getPrice(uint256 tokenId) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  
  // Funciones de escritura
  "function mintNFT(string memory uri, uint256 royaltyPercentage) payable returns (uint256)",
  "function setTokenPrice(uint256 tokenId, uint256 tokenPrice)",
  "function buyNFT(uint256 tokenId) payable",
  "function updateCollectionInfo(string memory _description, string memory _image)",
  
  // Eventos
  "event NFTMinted(uint256 tokenId, address creator, address owner, string tokenURI, uint256 price)",
  "event NFTSold(uint256 tokenId, address buyer, uint256 price)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// Interfaces
export interface CollectionInfo {
  collectionAddress: string;
  name: string;
  symbol: string;
  description: string;
  imageCid: string;
  owner: string;
  timestamp: number;
}

export interface CollectionNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  priceWei: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  tokenURI: string;
  collectionName: string;
  collectionSymbol: string;
}

/**
 * Obtiene todas las colecciones
 * @param provider Proveedor de Ethereum (opcional)
 * @param forceRefresh Forzar actualización del caché
 * @returns Array de colecciones
 */
export const getAllCollections = async (
  provider?: ethers.providers.Provider,
  forceRefresh = false
): Promise<CollectionInfo[]> => {
  // Verificar caché si no se fuerza actualización
  if (!forceRefresh && isCacheValid() && collectionsCache.allCollections) {
    console.log('Usando caché para getAllCollections');
    return collectionsCache.allCollections;
  }

  try {
    // Usar la wallet como proveedor principal
    const contract = await getFactoryContract();
    
    // Verificar que el contrato está listo
    if (!contract.provider) {
      console.log('Provider no disponible');
      return [];
    }

    // Verificar que estamos en la red correcta
    const network = await contract.provider.getNetwork();
    console.log('Red actual:', network);
    
    if (network.chainId !== 421614) { // Arbitrum Sepolia
      console.log('Red incorrecta');
      return [];
    }
    
    // Primero intentamos obtener el total de colecciones
    const total = await contract.getTotalCollections();
    console.log('Total de colecciones:', total.toString());
    
    if (total.toNumber() === 0) {
      console.log('No hay colecciones disponibles');
      return [];
    }
    
    // Intentamos getAllCollections
    const collections = await contract.getAllCollections();
    
    if (!collections || collections.length === 0) {
      console.log('No se encontraron colecciones');
      return [];
    }
    
    const result = collections.map((collection: any) => ({
      collectionAddress: collection.collectionAddress,
      name: collection.name,
      symbol: collection.symbol,
      description: collection.description,
      imageCid: collection.imageCid,
      owner: collection.owner,
      timestamp: collection.timestamp.toNumber()
    }));
    
    // Actualizar caché
    collectionsCache.allCollections = result;
    updateCache();
    
    return result;
  } catch (error: any) {
    console.error('Error obteniendo colecciones:', error);
    return [];
  }
};

/**
 * Obtiene las colecciones de un propietario
 * @param owner Dirección del propietario
 * @param provider Proveedor de Ethereum (opcional)
 * @param forceRefresh Forzar actualización del caché
 * @returns Array de colecciones
 */
export const getCollectionsByOwner = async (
  owner: string,
  provider?: ethers.providers.Provider,
  forceRefresh = false
): Promise<CollectionInfo[]> => {
  const ownerLower = owner.toLowerCase();
  
  // Verificar caché si no se fuerza actualización
  if (!forceRefresh && isCacheValid() && collectionsCache.ownerCollections[ownerLower]) {
    console.log(`Usando caché para getCollectionsByOwner de ${ownerLower}`);
    return collectionsCache.ownerCollections[ownerLower];
  }
  
  try {
    console.log('Intentando obtener colecciones para:', owner);
    
    // Primero intentamos obtener todas las colecciones
    const allCollections = await getAllCollections();
    
    // Filtrar las que pertenecen al propietario
    const ownerCollections = allCollections.filter(
      collection => collection.owner.toLowerCase() === ownerLower
    );
    
    // Actualizar caché
    collectionsCache.ownerCollections[ownerLower] = ownerCollections;
    updateCache();
    
    return ownerCollections;
  } catch (error: any) {
    console.error(`Error obteniendo colecciones para propietario ${owner}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo NFT en una colección
 * @param collectionAddress Dirección de la colección
 * @param to Dirección del propietario inicial (no usado con mintNFT)
 * @param uri URI del NFT (IPFS)
 * @param price Precio del NFT (no usado con mintNFT)
 * @param signer Firmante para la transacción
 * @returns Resultado de la creación
 */
export const createNFTInCollection = async (
  collectionAddress: string,
  to: string,
  uri: string,
  price: string,
  signer: ethers.Signer
) => {
  try {
    // Crear contrato con el signer explícitamente
    const contract = new ethers.Contract(
      collectionAddress,
      NaniBoronatNFTABI, // Usar el ABI correcto para NaniBoronatNFT
      signer
    );
    
    console.log("Creando NFT con signer:", await signer.getAddress());
    
    // Obtener el precio de minteo del contrato
    const mintPrice = await contract.mintPrice();
    console.log("Precio de minteo:", ethers.utils.formatEther(mintPrice), "ETH");
    
    // Establecer royalties al 5%
    const royaltyPercentage = 500; // 5%
    
    // Estimar gas para asegurar que la transacción funcionará
    console.log("Estimando gas para mintNFT con URI:", uri);
    const gasEstimate = await contract.estimateGas.mintNFT(uri, royaltyPercentage, {
      value: mintPrice
    });
    console.log("Gas estimado:", gasEstimate.toString());
    
    // Crear el NFT usando mintNFT como está definido en el contrato
    const tx = await contract.mintNFT(uri, royaltyPercentage, {
      value: mintPrice,
      gasLimit: Math.floor(gasEstimate.toNumber() * 1.2) // Añadir 20% extra de gas
    });
    
    console.log("Transacción enviada:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transacción confirmada:", receipt.transactionHash);
    
    // Buscar el evento NFTMinted en el recibo
    const event = receipt.events?.find((event: any) => event.event === 'NFTMinted');
    
    if (event) {
      const tokenId = event.args.tokenId.toString();
      return {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash
      };
    }
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error: any) {
    console.error("Error creando NFT en colección:", error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

/**
 * Compra un NFT de una colección
 * @param collectionAddress Dirección de la colección
 * @param tokenId ID del token a comprar
 * @param price Precio del NFT
 * @param signer Firmante para la transacción
 * @returns Resultado de la compra
 */
export const buyNFTFromCollection = async (
  collectionAddress: string,
  tokenId: string,
  price: string,
  signer: ethers.Signer
) => {
  try {
    // Crear contrato con el signer explícitamente
    const contract = new ethers.Contract(
      collectionAddress,
      NFT_COLLECTION_ABI,
      signer
    );
    
    console.log("Comprando NFT con signer:", await signer.getAddress());
    
    // Comprar el NFT
    const tx = await contract.buyNFT(tokenId, {
      value: ethers.utils.parseEther(price),
      gasLimit: 500000 // Límite de gas adecuado para esta operación
    });
    
    console.log("Transacción enviada:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transacción confirmada:", receipt.transactionHash);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash
    };
  } catch (error: any) {
    console.error("Error buying NFT:", error);
    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

/**
 * Obtiene los metadatos de un token
 * @param tokenUri URI del token
 * @param tokenId ID del token para logging
 * @returns Metadatos del token o un objeto con error
 */
export const fetchTokenMetadata = async (tokenUri: string, tokenId: string): Promise<any> => {
  // Si no hay URI, devolver un objeto vacío
  if (!tokenUri) {
    console.error(`URI vacía para el token ID: ${tokenId}`);
    return { 
      name: `Token #${tokenId}`, 
      description: 'Metadatos no disponibles',
      error: true
    };
  }

  // Registrar la URI original para debugging
  console.log(`🔍 Obteniendo metadatos para token #${tokenId}. URI original:`, tokenUri);
  
  // Corregir URI con ipfs:// duplicado - manejar múltiples casos
  let uri = tokenUri;
  if (uri.includes('ipfs://ipfs://')) {
    // Eliminar todas las ocurrencias de 'ipfs://' excepto la última
    while (uri.includes('ipfs://ipfs://')) {
      uri = uri.replace('ipfs://ipfs://', 'ipfs://');
    }
    console.log(`🔧 URI corregida:`, uri);
  }

  // Lista de URLs a probar (diferentes gateways)
  const urlsToTry: string[] = [];
  
  // Generar URLs con diferentes gateways
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '');
    // Usar todos los gateways disponibles
    urlsToTry.push(...IPFS_GATEWAYS.map(gateway => `${gateway}${cid}`));
  } else if (uri.startsWith('http')) {
    // Si es HTTP, intentar primero con esa URL
    urlsToTry.push(uri);
    
    // Si contiene /ipfs/, intentar con otros gateways
    if (uri.includes('/ipfs/')) {
      const parts = uri.split('/ipfs/');
      if (parts.length > 1) {
        const cid = parts[1];
        // Añadir otros gateways
        const otherGateways = IPFS_GATEWAYS.filter(gw => !uri.includes(gw));
        urlsToTry.push(...otherGateways.map(gateway => `${gateway}${cid}`));
      }
    }
  } else if (uri.startsWith('Qm') && uri.length >= 46) {
    // Parece ser un CID directo
    urlsToTry.push(...IPFS_GATEWAYS.map(gateway => `${gateway}${uri}`));
  } else {
    // En caso de otro formato, usar como está
    urlsToTry.push(uri);
  }
  
  // Añadir parámetro timestamp para evitar caché
  const timestamp = Date.now();
  const urlsWithTimestamp = urlsToTry.map(url => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${timestamp}`;
  });
  
  console.log(`🌐 Intentando con ${urlsWithTimestamp.length} URLs para el token #${tokenId}`);
  
  // Opciones de fetch con timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
  
  const fetchOptions = {
    method: 'GET',
    signal: controller.signal,
    mode: 'cors' as RequestMode, // Solicitar CORS
    headers: {
      'Accept': 'application/json'
    }
  };
  
  // Probar cada URL hasta que una funcione
  let lastError;
  for (const url of urlsWithTimestamp) {
    try {
      console.log(`⏳ Intentando fetch: ${url}`);
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        console.warn(`❌ Error ${response.status} al obtener metadatos de ${url}`);
        lastError = new Error(`HTTP error ${response.status}`);
        continue; // Probar siguiente URL
      }
      
      // Limpieza del timeout
      clearTimeout(timeoutId);
      
      // Intentar parsear el JSON
      const metadata = await response.json();
      console.log(`✅ Metadatos obtenidos para token #${tokenId}:`, metadata);
      
      // Procesar la imagen si existe
      if (metadata.image) {
        // Verificar y procesar la URL de la imagen
        if (metadata.image.includes('ipfs://ipfs://')) {
          console.log(`🛠️ Corrigiendo URL de imagen con múltiple ipfs://: ${metadata.image}`);
          // Corregir múltiples ipfs://
          while (metadata.image.includes('ipfs://ipfs://')) {
            metadata.image = metadata.image.replace('ipfs://ipfs://', 'ipfs://');
          }
        }
        
        // Convertir ipfs:// en HTTP URL
        if (metadata.image.startsWith('ipfs://')) {
          const imageCid = metadata.image.replace('ipfs://', '');
          metadata.image = `${IPFS_GATEWAYS[0]}${imageCid}?_t=${Date.now()}`;
          console.log(`🖼️ URL de imagen procesada: ${metadata.image}`);
        }
      }
      
      // Añadir tokenId para referencia
      return {
        ...metadata,
        tokenId
      };
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Timeout al obtener metadatos de ${url}`);
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn(`🔒 Error CORS al obtener metadatos de ${url}`);
      } else {
        console.error(`❌ Error al obtener metadatos de ${url}:`, error);
      }
      // Continuar con la siguiente URL
    }
  }
  
  // Si llegamos aquí, todas las URLs fallaron
  console.error(`❌ No se pudieron obtener metadatos para token #${tokenId} después de probar ${urlsWithTimestamp.length} URLs`);
  
  // Devolver un objeto con error pero con datos mínimos para mostrar algo al usuario
  return {
    name: `Token #${tokenId}`,
    description: 'No se pudieron cargar los metadatos',
    image: '',
    error: true,
    originalUri: tokenUri,
    lastError: lastError ? lastError.message : 'Error desconocido',
    tokenId
  };
};

/**
 * Obtiene todos los NFTs de una colección
 * @param collectionAddress Dirección de la colección
 * @param provider Proveedor de Ethereum (opcional)
 * @param forceRefresh Forzar refresco ignorando caché (opcional)
 * @returns Lista de NFTs
 */
export const getNFTsFromCollection = async (
  collectionAddress: string,
  provider?: ethers.providers.Provider,
  forceRefresh: boolean = false
): Promise<CollectionNFT[]> => {
  try {
    console.log('Comenzando obtención de NFTs para la colección:', collectionAddress);
    
    // Verificar caché si está disponible y no se fuerza refresco
    if (!forceRefresh && isCacheValid() && collectionsCache.nftsInCollection[collectionAddress]) {
      console.log('Usando caché para NFTs de la colección:', collectionAddress);
      return collectionsCache.nftsInCollection[collectionAddress];
    }
    
    console.log(forceRefresh ? 'Forzando refresco de caché' : 'Caché no disponible, obteniendo datos frescos');
    
    const collectionContract = await getCollectionContract(collectionAddress);
    
    // Obtener el total de tokens
    const totalSupply = await collectionContract.totalSupply();
    console.log(`Total de NFTs en la colección: ${totalSupply.toString()}`);
    
    const name = await collectionContract.name();
    const symbol = await collectionContract.symbol();
    
    console.log(`Colección ${name} (${symbol}) tiene ${totalSupply} NFTs`);
    
    // Si no hay tokens, devolver un array vacío
    if (totalSupply.eq(0)) {
      return [];
    }
    
    // Obtener todos los tokens
    const tokens: CollectionNFT[] = [];
    
    // Set para trackear URIs y evitar duplicados visuales
    const processedMetadata: Record<string, any> = {};
    
    for (let i = 0; i < totalSupply.toNumber(); i++) {
      try {
        const tokenId = await collectionContract.tokenByIndex(i);
        console.log(`Procesando token #${tokenId.toString()} (${i+1}/${totalSupply})`);
        
        // Obtener URI del token
        const tokenURI = await collectionContract.tokenURI(tokenId);
        
        // Verificar si ya procesamos esta URI
        let metadata = processedMetadata[tokenURI];
        if (!metadata) {
          // Si no está en caché, obtener los metadatos
          metadata = await fetchTokenMetadata(tokenURI, tokenId.toString());
          processedMetadata[tokenURI] = metadata;
        }
        
        // Obtener propietario
        const owner = await collectionContract.ownerOf(tokenId);
        
        // Obtener precio
        const priceWei = await collectionContract.getPrice(tokenId);
        const price = ethers.utils.formatEther(priceWei);
        
        // Crear un nombre predeterminado basado en el tokenId si no hay nombre en los metadatos
        const nftName = metadata.name || `NFT #${tokenId.toString()}`;
        
        tokens.push({
          id: `${collectionAddress}-${tokenId.toString()}`,
          name: nftName,
          description: metadata.description || '',
          image: metadata.image || '',
          price: price,
          priceWei: priceWei.toString(),
          tokenId: tokenId.toString(),
          contractAddress: collectionAddress,
          owner,
          tokenURI,
          collectionName: name,
          collectionSymbol: symbol
        });
      } catch (error) {
        console.error(`Error obteniendo información del token #${i}:`, error);
      }
    }
    
    console.log(`Obtenidos ${tokens.length} NFTs de ${totalSupply} total`);
    
    // Agrupar NFTs por nombre para depuración
    const groupedByName: Record<string, number> = {};
    tokens.forEach(token => {
      const tokenName = token.name;
      groupedByName[tokenName] = (groupedByName[tokenName] || 0) + 1;
    });
    
    console.log('NFTs agrupados por nombre:', groupedByName);
    
    // Actualizar caché
    collectionsCache.nftsInCollection[collectionAddress] = tokens;
    updateCache();
    
    return tokens;
  } catch (error) {
    console.error('Error obteniendo NFTs de la colección:', error);
    return [];
  }
};

/**
 * Obtiene los NFTs de una colección pertenecientes a un propietario
 * @param collectionAddress Dirección de la colección
 * @param ownerAddress Dirección del propietario
 * @param provider Proveedor de Ethereum (opcional)
 * @returns Lista de NFTs del propietario
 */
export const getNFTsFromCollectionByOwner = async (
  collectionAddress: string,
  ownerAddress: string,
  provider?: ethers.providers.Provider
): Promise<CollectionNFT[]> => {
  try {
    const collectionContract = await getCollectionContract(collectionAddress);
    
    // Obtener información básica de la colección
    const name = await collectionContract.name();
    const symbol = await collectionContract.symbol();
    const balance = await collectionContract.balanceOf(ownerAddress);
    
    console.log(`${ownerAddress} tiene ${balance.toString()} NFTs en la colección ${name}`);
    
    const nfts: CollectionNFT[] = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      try {
        const tokenId = await collectionContract.tokenOfOwnerByIndex(ownerAddress, i);
        const tokenURI = await collectionContract.tokenURI(tokenId);
        const priceWei = await collectionContract.getPrice(tokenId);
        const price = ethers.utils.formatEther(priceWei);
        
        // Obtener metadata del token
        let metadata: any = {};
        if (tokenURI) {
          try {
            if (tokenURI.startsWith('ipfs://')) {
              const ipfsHash = tokenURI.replace('ipfs://', '');
              const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
              metadata = await response.json();
            } else if (tokenURI.startsWith('http')) {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            }
          } catch (e) {
            console.error(`Error fetching metadata for token ${tokenId}:`, e);
            metadata = { name: `Token #${tokenId}`, description: 'Metadata no disponible' };
          }
        }
        
        nfts.push({
          id: `${collectionAddress}-${tokenId.toString()}`,
          name: metadata.name || `Token #${tokenId}`,
          description: metadata.description || '',
          image: metadata.image || '',
          price,
          priceWei: priceWei.toString(),
          tokenId: tokenId.toString(),
          contractAddress: collectionAddress,
          owner: ownerAddress,
          tokenURI,
          collectionName: name,
          collectionSymbol: symbol
        });
      } catch (e) {
        console.error(`Error obteniendo NFT del propietario, índice ${i}:`, e);
      }
    }
    
    return nfts;
  } catch (error) {
    console.error(`Error obteniendo NFTs para propietario ${ownerAddress}:`, error);
    return [];
  }
};

// Dirección del contrato de colecciones NaniBoronat (CAMBIAR POR LA REAL DESPUÉS DEL DESPLIEGUE)
const NB_COLLECTION_CONTRACT_ADDRESS = process.env.REACT_APP_COLLECTION_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';

// ABI del contrato NaniBoronatCollection
const NB_COLLECTION_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "nftContract",
        "type": "address"
      }
    ],
    "name": "CollectionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "name": "CollectionStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "image",
        "type": "string"
      }
    ],
    "name": "CollectionUpdated",
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
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "image",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseTokenURI",
        "type": "string"
      }
    ],
    "name": "createCollection",
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
    "name": "getAllCollections",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "nftContract",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct NaniBoronatCollection.Collection[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveCollections",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "nftContract",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct NaniBoronatCollection.Collection[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCollectionCount",
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
        "name": "collectionId",
        "type": "uint256"
      }
    ],
    "name": "getCollectionDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "nftContract",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct NaniBoronatCollection.Collection",
        "name": "",
        "type": "tuple"
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
    "name": "getCollectionsByOwner",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "nftContract",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct NaniBoronatCollection.Collection[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      }
    ],
    "name": "getNFTContract",
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
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "ownerCollections",
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
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "name": "setCollectionActive",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "collectionId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "image",
        "type": "string"
      }
    ],
    "name": "updateCollection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export interface NBCollection {
  id: number;
  name: string;
  description: string;
  image: string;
  nftContract: string;
  owner: string;
  active: boolean;
}

/**
 * Obtiene la instancia del contrato NaniBoronat de colecciones
 * @param needSigner Si es true, usa signer en lugar de provider
 * @returns Instancia del contrato
 */
export const getNBCollectionContract = async (needSigner = false) => {
  try {
    // Crear provider y obtener signer si es necesario
    const provider = await createProvider();
    let providerOrSigner: ethers.providers.Provider | ethers.Signer = provider;
    
    if (needSigner) {
      if ('getSigner' in provider) {
        const web3Provider = provider as ethers.providers.Web3Provider;
        providerOrSigner = web3Provider.getSigner();
      }
    }
    
    const contract = new ethers.Contract(
      NB_COLLECTION_CONTRACT_ADDRESS, 
      NB_COLLECTION_CONTRACT_ABI, 
      providerOrSigner
    );
    return contract;
  } catch (error) {
    console.error('Error al obtener contrato de colecciones:', error);
    toast({
      title: 'Error al conectar con el contrato',
      description: 'No se pudo obtener el contrato de colecciones',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    throw error;
  }
};

/**
 * Obtiene todas las colecciones
 * @returns Array de colecciones
 */
export const getNBAllCollections = async (): Promise<NBCollection[]> => {
  try {
    const contract = await getNBCollectionContract();
    const collections = await contract.getAllCollections();
    
    return collections.map((collection: any) => ({
      id: collection.id.toNumber(),
      name: collection.name,
      description: collection.description,
      image: collection.image,
      nftContract: collection.nftContract,
      owner: collection.owner,
      active: collection.active
    }));
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar las colecciones',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return [];
  }
};

/**
 * Obtiene sólo las colecciones activas
 * @returns Array de colecciones activas
 */
export const getNBActiveCollections = async (): Promise<NBCollection[]> => {
  try {
    const contract = await getNBCollectionContract();
    const collections = await contract.getActiveCollections();
    
    return collections.map((collection: any) => ({
      id: collection.id.toNumber(),
      name: collection.name,
      description: collection.description,
      image: collection.image,
      nftContract: collection.nftContract,
      owner: collection.owner,
      active: collection.active
    }));
  } catch (error) {
    console.error('Error al obtener colecciones activas:', error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar las colecciones activas',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return [];
  }
};

/**
 * Obtiene las colecciones de un propietario específico
 * @param owner Dirección del propietario
 * @returns Array de colecciones del propietario
 */
export const getNBCollectionsByOwner = async (owner: string): Promise<NBCollection[]> => {
  try {
    const contract = await getNBCollectionContract();
    const collections = await contract.getCollectionsByOwner(owner);
    
    return collections.map((collection: any) => ({
      id: collection.id.toNumber(),
      name: collection.name,
      description: collection.description,
      image: collection.image,
      nftContract: collection.nftContract,
      owner: collection.owner,
      active: collection.active
    }));
  } catch (error) {
    console.error(`Error al obtener colecciones del propietario ${owner}:`, error);
    toast({
      title: 'Error',
      description: 'No se pudieron cargar tus colecciones',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return [];
  }
};

/**
 * Obtiene los detalles de una colección específica
 * @param collectionId ID de la colección
 * @returns Detalles de la colección o null si hay error
 */
export const getNBCollectionDetails = async (collectionId: number): Promise<NBCollection | null> => {
  try {
    const contract = await getNBCollectionContract();
    const collection = await contract.getCollectionDetails(collectionId);
    
    return {
      id: collection.id.toNumber(),
      name: collection.name,
      description: collection.description,
      image: collection.image,
      nftContract: collection.nftContract,
      owner: collection.owner,
      active: collection.active
    };
  } catch (error) {
    console.error(`Error al obtener detalles de la colección ${collectionId}:`, error);
    toast({
      title: 'Error',
      description: 'No se pudo cargar la información de la colección',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return null;
  }
};

/**
 * Obtiene la dirección del contrato NFT de una colección
 * @param collectionId ID de la colección
 * @returns Dirección del contrato NFT o null si hay error
 */
export const getNBNFTContractAddress = async (collectionId: number): Promise<string | null> => {
  try {
    const contract = await getNBCollectionContract();
    const nftContractAddress = await contract.getNFTContract(collectionId);
    return nftContractAddress;
  } catch (error) {
    console.error(`Error al obtener contrato NFT de la colección ${collectionId}:`, error);
    toast({
      title: 'Error',
      description: 'No se pudo obtener el contrato NFT de la colección',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return null;
  }
};

/**
 * Crea una nueva colección de NFTs
 * @param name Nombre de la colección
 * @param symbol Símbolo del contrato NFT
 * @param description Descripción de la colección
 * @param image URI de la imagen de la colección
 * @param baseTokenURI URI base para los metadatos
 * @returns ID de la colección creada o null si hay error
 */
export const createNBCollection = async (
  name: string,
  symbol: string,
  description: string,
  image: string,
  baseTokenURI: string
): Promise<number | null> => {
  try {
    // Verificamos que el usuario haya conectado su wallet
    if (!window.ethereum) {
      toast({
        title: 'Wallet no conectada',
        description: 'Conecta tu wallet para crear una colección',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
    
    const contract = await getNBCollectionContract(true);
    
    // Notificamos que se está procesando la transacción
    toast({
      title: 'Creando colección',
      description: 'Confirma la transacción en tu wallet...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    const tx = await contract.createCollection(name, symbol, description, image, baseTokenURI);
    
    // Notificamos que la transacción está en proceso
    toast({
      title: 'Transacción enviada',
      description: 'Espera mientras se confirma la transacción...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    // Esperamos a que se confirme la transacción
    const receipt = await tx.wait();
    
    // Buscamos el evento CollectionCreated para obtener el ID
    const event = receipt.events.find((e: any) => e.event === 'CollectionCreated');
    const collectionId = event.args.collectionId.toNumber();
    
    toast({
      title: '¡Colección creada!',
      description: `Tu colección "${name}" ha sido creada con éxito`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    return collectionId;
  } catch (error: any) {
    console.error('Error al crear colección:', error);
    
    // Manejo de errores específicos
    if (error.code === 'ACTION_REJECTED') {
      toast({
        title: 'Transacción cancelada',
        description: 'Has cancelado la creación de la colección',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Error al crear colección',
        description: error.message || 'Ocurrió un error al crear la colección',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    return null;
  }
};

/**
 * Actualiza la información de una colección existente
 * @param collectionId ID de la colección
 * @param name Nuevo nombre
 * @param description Nueva descripción
 * @param image Nueva URI de imagen
 * @returns true si la actualización fue exitosa, false en caso contrario
 */
export const updateNBCollection = async (
  collectionId: number,
  name: string,
  description: string,
  image: string
): Promise<boolean> => {
  try {
    const contract = await getNBCollectionContract(true);
    
    toast({
      title: 'Actualizando colección',
      description: 'Confirma la transacción en tu wallet...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    const tx = await contract.updateCollection(collectionId, name, description, image);
    
    toast({
      title: 'Transacción enviada',
      description: 'Espera mientras se confirma la actualización...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    await tx.wait();
    
    toast({
      title: '¡Colección actualizada!',
      description: `La colección ha sido actualizada con éxito`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    return true;
  } catch (error: any) {
    console.error(`Error al actualizar colección ${collectionId}:`, error);
    
    if (error.code === 'ACTION_REJECTED') {
      toast({
        title: 'Actualización cancelada',
        description: 'Has cancelado la actualización de la colección',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Error al actualizar',
        description: error.message || 'Ocurrió un error al actualizar la colección',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    return false;
  }
};

/**
 * Cambia el estado activo/inactivo de una colección
 * @param collectionId ID de la colección
 * @param active Nuevo estado (true = activo, false = inactivo)
 * @returns true si el cambio fue exitoso, false en caso contrario
 */
export const setNBCollectionActive = async (
  collectionId: number,
  active: boolean
): Promise<boolean> => {
  try {
    const contract = await getNBCollectionContract(true);
    
    toast({
      title: `${active ? 'Activando' : 'Desactivando'} colección`,
      description: 'Confirma la transacción en tu wallet...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    const tx = await contract.setCollectionActive(collectionId, active);
    
    toast({
      title: 'Transacción enviada',
      description: 'Espera mientras se confirma el cambio...',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
    
    await tx.wait();
    
    toast({
      title: 'Estado actualizado',
      description: `La colección ha sido ${active ? 'activada' : 'desactivada'} correctamente`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    return true;
  } catch (error: any) {
    console.error(`Error al cambiar estado de colección ${collectionId}:`, error);
    
    if (error.code === 'ACTION_REJECTED') {
      toast({
        title: 'Cambio cancelado',
        description: 'Has cancelado el cambio de estado de la colección',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Error al cambiar estado',
        description: error.message || 'Ocurrió un error al cambiar el estado de la colección',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    return false;
  }
};
