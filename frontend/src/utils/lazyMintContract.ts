import { ethers } from 'ethers';
import NaniBoronatLazyMintArtifact from '../abis/NaniBoronatLazyMint.json';

const LAZY_MINT_ABI = NaniBoronatLazyMintArtifact.abi;

/**
 * Obtiene una instancia del contrato de lazy minting para una colección
 */
export const getLazyMintContract = (
  collection: { address: string },
  signerOrProvider: ethers.Signer | ethers.providers.Provider
) => {
  if (!collection || !collection.address) throw new Error('Colección o dirección no definida');
  return new ethers.Contract(collection.address, LAZY_MINT_ABI, signerOrProvider);
};

/**
 * Obtiene los IDs de los NFTs disponibles para lazy mint de una colección
 */
export const getAvailableNFTIds = async (
  collection: { address: string },
  provider: ethers.providers.Provider
): Promise<string[]> => {
  const contract = getLazyMintContract(collection, provider);
  const ids = await contract.getAvailableNFTIds();
  return ids;
};

/**
 * Obtiene la información de todos los NFTs disponibles incluyendo sus metadatos
 */
export const getAllAvailableNFTsInfo = async (
  collection: { address: string },
  provider: ethers.providers.Provider
) => {
  const contract = getLazyMintContract(collection, provider);
  const availableIds = await contract.getAvailableNFTIds();

  const nftsWithInfo = await Promise.all(
    availableIds.map(async (lazyId: string) => {
      try {
        // Consulta real al contrato
        const nft = await contract.availableNFTs(lazyId);
        return {
          lazyId,
          metadataURI: nft.metadataURI,
          price: ethers.utils.formatEther(nft.price),
          royaltyPercentage: nft.royaltyPercentage,
          isActive: nft.isActive,
        };
      } catch (err) {
        console.error(`Error obteniendo información para NFT ${lazyId}:`, err);
        return null;
      }
    })
  );

  return nftsWithInfo.filter((nft) => nft !== null);
};

/**
 * Obtiene la información de un NFT disponible para lazy mint
 */
export const getAvailableNFTInfo = async (
  collection: { address: string },
  lazyId: string,
  provider: ethers.providers.Provider
) => {
  const contract = getLazyMintContract(collection, provider);
  const nft = await contract.availableNFTs(lazyId);
  return {
    lazyId,
    metadataURI: nft.metadataURI,
    price: ethers.utils.formatEther(nft.price),
    royaltyPercentage: nft.royaltyPercentage,
    isActive: nft.isActive,
  };
};

/**
 * Compra y mintea un NFT (ejemplo, debe adaptarse a tu contrato real)
 */
export interface MintResult {
  success: boolean;
  tokenId: string | number;
  [key: string]: any;
}

export const purchaseAndMintNFT = async (
  collection: { address: string },
  lazyId: string,
  signer: ethers.Signer
): Promise<MintResult> => {
  const contract = getLazyMintContract(collection, signer);
  // Lógica real de minteo con crypto
  // 1. Obtener el precio real del NFT desde el contrato
  const nftInfo = await contract.availableNFTs(lazyId);
  const price = nftInfo.price;

  // 2. Ejecutar la función de minteo del contrato
  const tx = await contract.purchaseAndMint(lazyId, { value: price });
  const receipt = await tx.wait();

  // 3. Extraer el tokenId del evento Transfer
  let tokenId = null;
  if (receipt && receipt.events) {
    const transferEvent = receipt.events.find((e: any) => e.event === 'Transfer');
    if (transferEvent && transferEvent.args && transferEvent.args.tokenId) {
      tokenId = transferEvent.args.tokenId.toString();
    }
  }

  return {
    success: !!tokenId,
    tokenId: tokenId || '',
  };

};

/**
 * Inicia el proceso de compra de un NFT con tarjeta a través de Stripe
 */
export const purchaseNFTWithStripe = async (
  lazyId: string,
  email: string,
  collection: { address: string },
  walletAddress?: string,
  metadataUrl?: string,
  priceEur?: number
) => {
  // Aquí deberías hacer una petición a tu backend para iniciar la sesión de pago
  const body: Record<string, any> = {
    lazyId,
    email,
    contractAddress: collection.address
  };
  if (walletAddress) {
    body.walletAddress = walletAddress;
  }
  if (metadataUrl) {
    body.metadataUrl = metadataUrl;
  }
  if (priceEur) {
    body.priceEur = priceEur;
  }

  // LOG para depuración: Verificar que contractAddress y metadata se envían correctamente
  if (typeof window !== 'undefined' && window.console) {
    console.log('[DEBUG][purchaseNFTWithStripe] Payload enviado al backend:', JSON.stringify(body, null, 2));
  }

  // Detectar entorno y construir la URL del backend correctamente
  let backendUrl = '';
  if (process.env.REACT_APP_BACKEND_URL) {
    backendUrl = process.env.REACT_APP_BACKEND_URL;
  } else if (window.location.hostname === 'localhost') {
    backendUrl = '';
  } else {
    backendUrl = process.env.REACT_APP_API_URL || 'https://nani-boronat-api.vercel.app';
  }

  const response = await fetch(`${backendUrl}/payment/lazy-mint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let session;
  try {
    session = await response.json();
  } catch (e) {
    throw new Error('Error inesperado al interpretar la respuesta del servidor');
  }

  if (!response.ok) {
    throw new Error(session?.error || 'Error al crear la sesión de pago');
  }

  return { url: session.url };
};