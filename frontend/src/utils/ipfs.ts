import axios from 'axios';
import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

// Definición de la interfaz PinataConfig
export interface PinataConfig {
  apiKey: string;
  apiSecret: string;
}

// Configuración de Pinata IPFS
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzZTNiMzViNS0yY2MyLTQzZjEtYjBlZC02NjViNDgxMGUwYTIiLCJlbWFpbCI6InZjdHIucHJ6Ljg5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0ZDY2YjQ5YzNmMTg3ZTAzMTI2YyIsInNjb3BlZEtleVNlY3JldCI6ImRlMGI4ZmY2YmQ4NWE4NjQ3YzdkNDFkN2U5M2Q2MTNlZTY1MDFmMDZiYjEyZmNkM2I5NDQ5YmRkMDMzYmY4MGMiLCJleHAiOjE3NzYxOTU5OTh9.9oEvnq2WJFpma0AdxLs4RiBz4aqpAcC4ovVGXjckfbU";
const PINATA_API_URL = process.env.REACT_APP_IPFS_API_URL || "https://api.pinata.cloud";

console.log('Environment:', process.env.NODE_ENV);
console.log('Pinata JWT configurado correctamente');

// Imagen de placeholder para cuando no hay imagen disponible
export const PLACEHOLDER_IMAGE = "/placeholder-nft.png";

// Lista de gateways IPFS
export const IPFS_GATEWAYS = process.env.REACT_APP_IPFS_GATEWAYS ? JSON.parse(process.env.REACT_APP_IPFS_GATEWAYS) : [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.infura.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://ipfs-gateway.cloud/ipfs/'
];

// Gateway actual (podría guardarse en localStorage para persistencia)
let currentGatewayIndex = 0;

// Headers para peticiones a Pinata
const getHeaders = () => {
  return {
    'Authorization': `Bearer ${PINATA_JWT}`,
  };
};

/**
 * Sube una imagen a IPFS usando Pinata
 * @param file Archivo a subir
 * @param config Configuración de Pinata
 * @param onProgress Callback para actualizar el progreso de la subida
 * @returns URI de IPFS
 */
export const uploadImageToIPFS = async (
  file: File,
  config: PinataConfig,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const pinataMetadata = JSON.stringify({
    name: file.name,
    keyvalues: {
      type: 'image',
      timestamp: Date.now().toString()
    }
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  const pinataOptions = JSON.stringify({
    cidVersion: 0
  });
  formData.append('pinataOptions', pinataOptions);
  
  try {
    // Crear toast manualmente en lugar de usar el hook
    const toast = (options: any) => {
      console.log('Toast notification:', options);
      // Aquí iría la implementación del toast
      return 'toast-id';
    };
    
    toast.update = (id: string, options: any) => {
      console.log(`Updating toast ${id}:`, options);
      // Aquí iría la actualización del toast
    };
    
    const uploadToastId = toast({
      title: 'Subiendo imagen...',
      description: 'Espera mientras subimos tu imagen a IPFS',
      status: 'info',
      duration: null,
      isClosable: false,
      position: 'bottom-right',
    });
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data;`,
          pinata_api_key: config.apiKey,
          pinata_secret_api_key: config.apiSecret
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (onProgress) {
              onProgress(percentCompleted);
            }
          }
        }
      }
    );
    
    toast.update(uploadToastId, {
      title: 'Imagen subida exitosamente',
      description: 'Tu imagen ha sido almacenada en IPFS',
      status: 'success',
      duration: 5000,
    });
    
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error al subir imagen a IPFS:', error);
    // Crear toast manualmente
    const errorToast = {
      title: 'Error al subir imagen',
      description: 'No se pudo subir la imagen a IPFS. Inténtalo de nuevo.',
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
    };
    console.log('Error toast:', errorToast);
    throw new Error('Error al subir imagen a IPFS');
  }
};

/**
 * Sube metadata a IPFS usando Pinata
 * @param metadata Objeto con la metadata
 * @param config Configuración de Pinata
 * @returns URI de IPFS
 */
export const uploadMetadataToIPFS = async (
  metadata: any,
  config: PinataConfig
): Promise<string> => {
  try {
    // Crear toast manualmente en lugar de usar el hook
    const toast = (options: any) => {
      console.log('Toast notification:', options);
      // Aquí iría la implementación del toast
      return 'toast-id';
    };
    
    toast.update = (id: string, options: any) => {
      console.log(`Updating toast ${id}:`, options);
      // Aquí iría la actualización del toast
    };
    
    const uploadToastId = toast({
      title: 'Subiendo metadata...',
      description: 'Espera mientras subimos los metadatos a IPFS',
      status: 'info',
      duration: null,
      isClosable: false,
      position: 'bottom-right',
    });
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: config.apiKey,
          pinata_secret_api_key: config.apiSecret
        }
      }
    );
    
    toast.update(uploadToastId, {
      title: 'Metadata subida exitosamente',
      description: 'Tus metadatos han sido almacenados en IPFS',
      status: 'success',
      duration: 5000,
    });
    
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error al subir metadata a IPFS:', error);
    // Crear toast manualmente
    const errorToast = {
      title: 'Error al subir metadata',
      description: 'No se pudo subir los metadatos a IPFS. Inténtalo de nuevo.',
      status: 'error',
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
    };
    console.log('Error toast:', errorToast);
    throw new Error('Error al subir metadata a IPFS');
  }
};

/**
 * Sube los metadatos de un NFT a IPFS
 * @param metadata Metadatos del NFT
 * @returns CID de IPFS
 */
export const uploadNFTMetadataToIPFS = async (metadata: {
  name: string;
  description: string;
  image: string; // CID de IPFS de la imagen
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): Promise<string> => {
  try {
    // Asegurarse de que la imagen use el formato ipfs://
    const imageCID = metadata.image.startsWith('ipfs://')
      ? metadata.image
      : `ipfs://${metadata.image}`;

    const metadataWithIPFS = {
      ...metadata,
      image: imageCID
    };

    // Subir a IPFS usando Pinata
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      metadataWithIPFS,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.IpfsHash;
  } catch (error: any) {
    console.error('Error subiendo metadatos a IPFS:', error);
    throw new Error(error.message || 'Error subiendo metadatos a IPFS');
  }
};

/**
 * Sube los metadatos de una colección a IPFS
 * @param metadata Metadatos de la colección
 * @returns CID de IPFS
 */
export const uploadCollectionMetadataToIPFS = async (metadata: {
  name: string;
  symbol: string;
  description: string;
  image: string; // CID de IPFS de la imagen
}): Promise<string> => {
  try {
    // Asegurarse de que la imagen use el formato ipfs://
    const imageCID = metadata.image.startsWith('ipfs://')
      ? metadata.image
      : `ipfs://${metadata.image}`;

    const metadataWithIPFS = {
      ...metadata,
      image: imageCID
    };

    // Subir a IPFS usando Pinata
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      metadataWithIPFS,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.IpfsHash;
  } catch (error: any) {
    console.error('Error subiendo metadatos de colección a IPFS:', error);
    throw new Error(error.message || 'Error subiendo metadatos de colección a IPFS');
  }
};

/**
 * Limpia una URL IPFS y la convierte en una URL HTTP utilizando el gateway predeterminado
 */
export const cleanIpfsUrl = (url: string | undefined | null): string => {
  // Si la URL es undefined o null, devolver placeholder
  if (!url) {
    console.warn('URL indefinida o nula');
    return PLACEHOLDER_IMAGE;
  }

  try {
    // Caso 1: Si ya es una URL HTTP/HTTPS, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Caso 2: Corregir URLs con doble o múltiple 'ipfs://'
    if (url.includes('ipfs://ipfs://')) {
      // Eliminar todas las ocurrencias de 'ipfs://' excepto la última
      let cleanedUrl = url;
      while (cleanedUrl.includes('ipfs://ipfs://')) {
        cleanedUrl = cleanedUrl.replace('ipfs://ipfs://', 'ipfs://');
      }
      const cid = cleanedUrl.replace('ipfs://', '');
      console.log(`Corrigiendo URL con múltiple ipfs://: ${url} -> ${IPFS_GATEWAYS[0]}${cid}`);
      return `${IPFS_GATEWAYS[0]}${cid}`;
    }

    // Caso 3: Corregir URLs malformadas como 'ipfs://ipfs:'
    if (url.startsWith('ipfs://ipfs:')) {
      const cid = url.replace('ipfs://ipfs:', '');
      console.log(`Corrigiendo URL malformada ipfs://ipfs:: ${url} -> ${IPFS_GATEWAYS[0]}${cid}`);
      return `${IPFS_GATEWAYS[0]}${cid}`;
    }

    // Caso 4: URLs normales con 'ipfs://'
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '');
      return `${IPFS_GATEWAYS[0]}${cid}`;
    }

    // Caso 5: URLs que incluyen '/ipfs/' en su estructura
    if (url.includes('/ipfs/')) {
      const parts = url.split('/ipfs/');
      if (parts.length > 1) {
        const cid = parts[1];
        return `${IPFS_GATEWAYS[0]}${cid}`;
      }
    }

    // Caso 6: Si parece ser un CID directo (comienza con Qm...)
    if (url.startsWith('Qm') && url.length >= 46) {
      return `${IPFS_GATEWAYS[0]}${url}`;
    }

    // Para URLs no reconocidas, mostrar advertencia y usar el gateway predeterminado
    console.warn(`Formato de URL IPFS no reconocido: ${url}`);
    return `${IPFS_GATEWAYS[0]}${url}`;
  } catch (error) {
    console.error(`Error al procesar URL IPFS: ${url}`, error);
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Obtiene la siguiente URL de gateway IPFS en orden rotativo
 */
export const getNextGatewayUrl = (currentUrl: string): string => {
  if (!currentUrl) {
    console.warn('URL actual indefinida o nula');
    return PLACEHOLDER_IMAGE;
  }

  try {
    // Extraer el CID de la URL actual
    let cid = '';
    
    // Si es una URL HTTP
    for (const gateway of IPFS_GATEWAYS) {
      if (currentUrl.includes(gateway)) {
        cid = currentUrl.replace(gateway, '');
        break;
      }
    }
    
    // Si no se encontró un CID, usar la URL completa como fallback
    if (!cid) {
      console.warn(`No se pudo extraer CID de URL: ${currentUrl}`);
      return PLACEHOLDER_IMAGE;
    }

    // Encontrar el índice del gateway actual
    let currentGatewayIndex = -1;
    for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
      if (currentUrl.includes(IPFS_GATEWAYS[i])) {
        currentGatewayIndex = i;
        break;
      }
    }

    // Obtener el siguiente gateway (o el primero si no se encuentra el actual)
    const nextIndex = (currentGatewayIndex + 1) % IPFS_GATEWAYS.length;
    const nextUrl = `${IPFS_GATEWAYS[nextIndex]}${cid}`;
    
    return nextUrl;
  } catch (error) {
    console.error(`Error al obtener siguiente gateway para URL: ${currentUrl}`, error);
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Obtiene una URL de imagen con fallback a diferentes gateways
 * @param url URL original de la imagen
 * @returns URL procesada lista para usar
 */
export const getImageWithFallback = (url: string): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  
  console.log("getImageWithFallback input:", url);
  
  try {
    // Si la URL ya es HTTP, devolverla tal cual
    if (url.startsWith('http')) {
      console.log("URL ya es HTTP, devolviendo tal cual");
      return url;
    }
    
    // Si es una URL de IPFS, convertirla a HTTP usando el primer gateway
    if (url.startsWith('ipfs://')) {
      const cid = url.replace('ipfs://', '');
      const httpUrl = `${IPFS_GATEWAYS[0]}${cid}`;
      console.log("URL IPFS convertida a HTTP:", httpUrl);
      return httpUrl;
    }
    
    // Si parece ser un CID directo
    if (url.startsWith('Qm') && url.length >= 46) {
      const httpUrl = `${IPFS_GATEWAYS[0]}${url}`;
      console.log("CID directo convertido a HTTP:", httpUrl);
      return httpUrl;
    }
    
    // Intentar limpiar la URL
    console.log("Intentando limpiar URL desconocida:", url);
    return cleanIpfsUrl(url);
  } catch (error) {
    console.error("Error al generar URL con fallback:", error);
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Hook para manejar imágenes IPFS con reintentos y fallbacks
 * @param originalUrl URL original de la imagen
 * @param maxRetries Número máximo de reintentos
 * @returns Estado de la imagen y funciones de manejo
 */
export const useIpfsImage = (originalUrl: string, maxRetries = 5) => {
  const [currentSrc, setCurrentSrc] = useState<string>(getImageWithFallback(originalUrl));
  const [error, setError] = useState<boolean>(false);
  const [retries, setRetries] = useState<number>(0);
  const [gatewayIndex, setGatewayIndex] = useState<number>(0);

  const handleImageError = () => {
    // Si ya hemos agotado todos los reintentos, usar imagen placeholder
    if (retries >= maxRetries) {
      console.log(`No se pudo cargar la imagen después de ${maxRetries} intentos. Usando placeholder.`);
      setCurrentSrc(PLACEHOLDER_IMAGE);
      setError(true);
      return;
    }

    // Intentar con el siguiente gateway
    const nextGatewayIndex = (gatewayIndex + 1) % IPFS_GATEWAYS.length;
    const newSrc = getIpfsHttpUrl(originalUrl, nextGatewayIndex);
    
    console.log(`Reintentando cargar imagen con gateway: ${IPFS_GATEWAYS[nextGatewayIndex]}`);
    
    setGatewayIndex(nextGatewayIndex);
    setCurrentSrc(newSrc);
    setRetries(prev => prev + 1);
  };

  // Resetear el estado cuando cambia la URL original
  useEffect(() => {
    setCurrentSrc(getImageWithFallback(originalUrl));
    setError(false);
    setRetries(0);
    setGatewayIndex(0);
  }, [originalUrl]);

  return { src: currentSrc, error, handleImageError };
};

/**
 * Extrae el CID de una URL IPFS
 * @param url URL IPFS (ipfs://CID o ipfs://ipfs/CID)
 * @returns CID sin prefijos
 */
export const getCIDFromUrl = (url: string): string => {
  if (!url) return '';
  
  // Limpiar cualquier prefijo ipfs:// o ipfs://ipfs/
  let cid = url;
  
  // Manejar el caso de prefijo duplicado ipfs://ipfs://
  if (cid.startsWith('ipfs://ipfs://')) {
    cid = cid.replace('ipfs://ipfs://', '');
  } else if (cid.startsWith('ipfs://ipfs/')) {
    cid = cid.replace('ipfs://ipfs/', '');
  } else if (cid.startsWith('ipfs://')) {
    cid = cid.replace('ipfs://', '');
  }
  
  // Eliminar cualquier parámetro de consulta o ruta después del CID
  cid = cid.split('?')[0];
  cid = cid.split('#')[0];
  cid = cid.split('/')[0];
  
  console.log(`Extracted CID: ${cid} from URL: ${url}`);
  return cid;
};

/**
 * Convierte una URL de IPFS a HTTP usando un gateway específico
 * @param url URL original (puede ser ipfs:// o CID directamente)
 * @param gatewayIndex Índice del gateway a usar
 * @returns URL HTTP completa
 */
export const getIpfsHttpUrl = (url: string, gatewayIndex = 0): string => {
  if (!url) return PLACEHOLDER_IMAGE;
  
  const cleanUrl = cleanIpfsUrl(url);
  
  // Si ya es una URL HTTP/HTTPS, devolverla tal cual
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  // Usar el gateway seleccionado
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  return `${gateway}${cleanUrl}`;
};

/**
 * Convierte una URI de IPFS a una URL HTTP
 * @param ipfsUri URI de IPFS (ipfs://CID o simplemente el CID)
 * @returns URL HTTP para acceder al recurso
 */
export const getIPFSUrl = (ipfsUri: string): string => {
  // console.log("Convirtiendo URI IPFS:", ipfsUri);
  
  try {
    if (!ipfsUri) return PLACEHOLDER_IMAGE;
    
    let cid: string;
    
    // Extraer el CID de diferentes formatos de URI IPFS
    if (ipfsUri.startsWith('ipfs://')) {
      cid = ipfsUri.replace('ipfs://', '');
    } else if (ipfsUri.startsWith('https://')) {
      // Si ya es una URL http(s), devolver tal cual
      console.log("Ya es una URL HTTP, devolviendo directamente:", ipfsUri);
      return ipfsUri;
    } else if (ipfsUri.startsWith('Qm') || ipfsUri.startsWith('bafy')) {
      // Parece un CID directamente
      cid = ipfsUri;
    } else {
      console.warn("Formato de URI IPFS no reconocido:", ipfsUri);
      return PLACEHOLDER_IMAGE;
    }
    
    // Usar gateway actual para generar URL
    const gateway = IPFS_GATEWAYS[currentGatewayIndex];
    const url = `${gateway}${cid}`;
    // console.log("URL IPFS generada:", url);
    
    return url;
  } catch (error) {
    console.error("Error procesando URI IPFS:", error);
    return PLACEHOLDER_IMAGE;
  }
};

/**
 * Cambia a la siguiente gateway IPFS en caso de error
 * @returns Nueva URL para el mismo CID
 */
export const rotateGateway = (cid: string): string => {
  currentGatewayIndex = (currentGatewayIndex + 1) % IPFS_GATEWAYS.length;
  return getIPFSUrl(`ipfs://${cid}`);
};

/**
 * Obtiene y parsea el contenido JSON de una URI IPFS
 * @param ipfsUri URI de IPFS
 * @returns Objeto JSON parseado
 */
export async function fetchIPFSJSON(ipfsUri: string): Promise<any> {
  console.log("Intentando obtener JSON de IPFS:", ipfsUri);

  let attempt = 0;
  let maxAttempts = IPFS_GATEWAYS.length * 2;
  let lastError;

  // Si ipfsUri es una URL HTTP(s) a un gateway específico, extraer el CID para usarlo con los gateways públicos
  let cid = '';
  try {
    if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
      // Buscar el patrón /ipfs/<cid>
      const match = ipfsUri.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        cid = match[1];
      } else {
        // Si no se encuentra, intentar extraer desde el final de la URL
        cid = ipfsUri.split('/').pop() || '';
      }
    } else {
      cid = getCIDFromUrl(ipfsUri);
    }
  } catch (e) {
    cid = getCIDFromUrl(ipfsUri);
  }

  if (!cid) {
    throw new Error(`No se pudo extraer el CID de la URI: ${ipfsUri}`);
  }

  while (attempt < maxAttempts) {
    const gatewayIndex = attempt % IPFS_GATEWAYS.length;
    const url = getIpfsHttpUrl(cid, gatewayIndex);
    try {
      console.log(`Intento ${attempt + 1}/${maxAttempts} - Obteniendo datos de:`, url);
      const response = await axios.get(url, { timeout: 7000 });
      if (response.data) {
        console.log("Datos IPFS obtenidos exitosamente:", response.data);
        return response.data;
      } else {
        throw new Error("Respuesta vacía");
      }
    } catch (error) {
      lastError = error;
      console.warn(`Error en intento ${attempt + 1}:`, error);
      attempt++;
      await new Promise(res => setTimeout(res, 350));
    }
  }
  
  console.error(`No se pudo obtener el JSON después de ${maxAttempts} intentos`);
  return null;
}; 