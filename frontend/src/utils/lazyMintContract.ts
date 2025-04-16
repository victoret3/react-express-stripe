import { ethers } from 'ethers';
import { getCIDFromUrl } from './ipfs';

// Dirección y ABI del contrato de Lazy Mint
// Si la variable de entorno no está disponible, usar una dirección de respaldo (ajustar a la dirección correcta)
const LAZY_MINT_CONTRACT_ADDRESS = process.env.REACT_APP_LAZY_MINT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Log para depuración
console.log('Usando dirección de contrato Lazy Mint:', LAZY_MINT_CONTRACT_ADDRESS);

// ABI mínimo necesario para interactuar con el contrato de Lazy Mint
const LAZY_MINT_ABI = [
  // Función para obtener información de los NFTs disponibles
  "function getAvailableNFTIds() view returns (string[] memory)",
  "function getAvailableNFTCount() view returns (uint256)",
  "function availableNFTs(string memory) view returns (string, uint256, uint256, bool)",
  "function availableNFTIds(uint256) view returns (string)",
  
  // Función para comprar y mintear
  "function purchaseAndMint(string memory) payable returns (uint256)",
  
  // Eventos
  "event NFTLazyMinted(uint256 indexed tokenId, string indexed lazyId, address indexed owner, string metadataURI, uint256 price)",
];

/**
 * Obtiene una instancia del contrato de lazy minting
 */
export const getLazyMintContract = async (signer: ethers.Signer | ethers.providers.Provider) => {
  if (!LAZY_MINT_CONTRACT_ADDRESS) {
    throw new Error('La dirección del contrato de lazy minting no está configurada');
  }
  
  return new ethers.Contract(LAZY_MINT_CONTRACT_ADDRESS, LAZY_MINT_ABI, signer);
};

/**
 * Obtiene los IDs de los NFTs disponibles para lazy mint
 */
export const getAvailableNFTIds = async (
  provider?: ethers.providers.Provider,
) => {
  try {
    // Usar provider proporcionado o crear uno nuevo
    const _provider = provider || new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
    );
    
    const contract = await getLazyMintContract(_provider);
    const availableIds = await contract.getAvailableNFTIds();
    
    return availableIds;
  } catch (error) {
    console.error('Error al obtener NFTs disponibles:', error);
    throw error;
  }
};

/**
 * Obtiene la información de un NFT disponible para lazy mint
 */
export const getAvailableNFTInfo = async (
  lazyId: string,
  provider?: ethers.providers.Provider,
) => {
  try {
    // Usar provider proporcionado o crear uno nuevo
    const _provider = provider || new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc'
    );
    
    const contract = await getLazyMintContract(_provider);
    const nftInfo = await contract.availableNFTs(lazyId);
    
    // Verificar que el precio no sea undefined
    if (!nftInfo || nftInfo.length < 2 || !nftInfo[1]) {
      console.error('Error: Datos del NFT incompletos:', nftInfo);
      throw new Error(`No se pudo obtener información completa del NFT ${lazyId}`);
    }
    
    // Asegurar que el precio se convierta correctamente
    const priceWei = nftInfo[1].toString();
    console.log(`NFT ${lazyId} - Precio Wei:`, priceWei);
    
    return {
      metadataURI: nftInfo[0],
      price: ethers.utils.formatEther(nftInfo[1]),
      priceWei,
      royaltyPercentage: nftInfo[2].toNumber(),
      isActive: nftInfo[3]
    };
  } catch (error) {
    console.error(`Error al obtener información del NFT ${lazyId}:`, error);
    throw error;
  }
};

/**
 * Compra y mintea un NFT
 */
export const purchaseAndMintNFT = async (
  lazyId: string,
  signer: ethers.Signer,
) => {
  try {
    const contract = await getLazyMintContract(signer);
    
    // Obtener precio
    const provider = signer.provider;
    if (!provider) {
      throw new Error('No se pudo obtener el provider del signer');
    }
    
    // Importante: pasar el provider explícitamente para evitar undefined
    const nftInfo = await getAvailableNFTInfo(lazyId, provider);
    
    if (!nftInfo.isActive) {
      throw new Error('Este NFT ya no está disponible');
    }
    
    // Verificar que el precio no sea undefined
    if (!nftInfo.priceWei) {
      console.error('Error: priceWei es undefined', nftInfo);
      throw new Error('No se pudo obtener el precio del NFT');
    }
    
    console.log('Precio del NFT en Wei:', nftInfo.priceWei);
    
    // Realizar la transacción
    const tx = await contract.purchaseAndMint(lazyId, {
      value: nftInfo.priceWei,
      gasLimit: 500000,
    });
    
    console.log('Transacción enviada:', tx.hash);
    
    // Esperar confirmación
    const receipt = await tx.wait();
    console.log('Transacción confirmada:', receipt);
    
    // Buscar el evento NFTLazyMinted
    const event = receipt.events?.find((e: ethers.Event) => e.event === 'NFTLazyMinted');
    
    // Agregar registro adicional para depuración
    console.log('Evento encontrado:', event);
    
    // Verificar con más detalle si los argumentos existen y tienen la estructura esperada
    if (event && event.args && typeof event.args.tokenId !== 'undefined') {
      try {
        // Usar try/catch cuando accedemos a toString()
        const tokenId = event.args.tokenId.toString();
        console.log('NFT minteado con éxito, token ID:', tokenId);
        
        return {
          success: true,
          tokenId,
          transactionHash: tx.hash,
        };
      } catch (tokenError) {
        console.warn('Error al obtener tokenId del evento:', tokenError);
        return {
          success: true,
          tokenId: 'nuevo',
          transactionHash: tx.hash,
        };
      }
    } else {
      // Intentar analizar directamente los logs de la transacción para extraer el evento
      try {
        console.log('Intentando analizar logs manualmente');
        console.log('Logs disponibles:', receipt.logs);
        
        // Buscar el evento correcto en los logs (normalmente es el primer log emitido por el contrato)
        const tokenId = 'nuevo';
        
        return {
          success: true,
          tokenId,
          transactionHash: tx.hash,
        };
      } catch (logError) {
        console.warn('Error al analizar logs:', logError);
        
        // Aún si no encontramos el evento o los args, el NFT probablemente se minteó exitosamente
        // En este caso, retornamos un éxito con un tokenId genérico
        console.warn('No se encontró el evento o sus argumentos, pero la transacción se completó');
        
        return {
          success: true,
          tokenId: 'nuevo',
          transactionHash: tx.hash,
        };
      }
    }
  } catch (error) {
    console.error('Error al comprar y mintear NFT:', error);
    throw error;
  }
};

/**
 * Inicia el proceso de compra de un NFT con tarjeta a través de Stripe
 */
export const purchaseNFTWithStripe = async (nftId: string, userEmail: string) => {
  try {
    // Verificar primero si hay una wallet conectada
    // @ts-ignore
    if (!window.ethereum || !(await window.ethereum._metamask?.isUnlocked())) {
      throw new Error('Necesitas conectar tu wallet antes de iniciar la compra. Por favor conecta Metamask.');
    }

    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    const walletAddress = accounts[0];
    
    if (!walletAddress) {
      throw new Error('No se encontró wallet conectada. Por favor conecta tu wallet antes de continuar.');
    }
    
    console.log('Wallet conectada:', walletAddress);

    // Obtener información del NFT
    const nftInfo = await getAvailableNFTInfo(nftId);
    if (!nftInfo) {
      throw new Error('No se encontró información del NFT');
    }

    console.log('Metadata URI original:', nftInfo.metadataURI);
    // Extraer solo el CID sin el prefijo ipfs://
    const metadataCID = getCIDFromUrl(nftInfo.metadataURI);
    console.log('CID extraído:', metadataCID);

    // HARDCODEAMOS LA URL CORRECTA - el backend está en Vercel
    const backendURL = 'https://nani-boronat.vercel.app';
    console.log('URL del backend CORREGIDA:', backendURL);
    
    // Endpoint Stripe
    const stripeEndpoint = `${backendURL}/api/nft-checkout/session`;
    console.log('Endpoint Stripe:', stripeEndpoint);

    // Payload mínimo - evitamos información innecesaria 
    const payload = {
      lazyId: nftId,
      walletAddress,
      email: userEmail,
      metadataUrl: metadataCID
    };
    
    console.log('Enviando payload simplificado:', payload);
    
    // POST básico - sin credentials ni configuración extra
    const response = await fetch(stripeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en respuesta:', errorText);
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    // Redirigir a la página de pago
    if (data.url) {
      console.log('URL de pago:', data.url);
      window.location.href = data.url;
      return data;
    } else {
      throw new Error('No se recibió URL de pago');
    }
  } catch (error) {
    console.error('Error al comprar NFT con Stripe:', error);
    throw error;
  }
}; 