import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Box,
  Image,
  Text,
  Button,
  HStack,
  Badge,
  Divider
} from '@chakra-ui/react';
import { NFT } from './types';
import { getImageWithFallback, getNextGatewayUrl, PLACEHOLDER_IMAGE, IPFS_GATEWAYS } from '../../utils/ipfs';

interface NFTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT | null;
  onBuyClick: (nft: NFT) => void;
  isOwned?: boolean;
  account?: string | null;
}

const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  nft, 
  onBuyClick, 
  isOwned = false, 
  account 
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);

  // Si es propiedad del usuario actual
  const isOwnedByUser = account && nft?.owner && account.toLowerCase() === nft.owner.toLowerCase();

  // Actualizar la imagen cuando cambie el NFT
  useEffect(() => {
    if (nft?.image) {
      // Asegurar que siempre usamos la función mejorada
      const imageUrl = getImageWithFallback(nft.image);
      console.log(`NFTDetailModal - Imagen original: ${nft.image} → procesada: ${imageUrl}`);
      setImageSrc(imageUrl);
      setRetryCount(0);
      setCurrentGatewayIndex(0);
    }
  }, [nft]);

  const handleImageError = () => {
    console.log(`Error al cargar la imagen en detalle (intento ${retryCount + 1}):`, nft?.image);
    
    if (retryCount >= IPFS_GATEWAYS.length - 1) {
      // Si ya intentamos con todos los gateways, usar placeholder
      console.log("Se agotaron los intentos de carga, usando placeholder");
      setImageSrc(PLACEHOLDER_IMAGE);
      return;
    }
    
    // Intentar con la siguiente gateway
    const nextGatewayIndex = (currentGatewayIndex + 1) % IPFS_GATEWAYS.length;
    const nextUrl = getNextGatewayUrl(imageSrc);
    console.log("Intentando con gateway alternativo:", nextUrl);
    setImageSrc(nextUrl);
    setRetryCount(prev => prev + 1);
    setCurrentGatewayIndex(nextGatewayIndex);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{nft?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <Image
                borderRadius="lg"
                src={imageSrc}
                alt={nft?.name}
                w="100%"
                h="auto"
                maxH="400px"
                objectFit="contain"
                onError={handleImageError}
                fallbackSrc={PLACEHOLDER_IMAGE}
              />
            </Box>
            {/* Información del NFT */}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NFTDetailModal; 