import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardBody, 
  Image, 
  Stack, 
  Heading, 
  Text, 
  Divider, 
  CardFooter, 
  Button, 
  Badge, 
  HStack,
  Tooltip,
  Box,
  AspectRatio,
  Skeleton
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { NFT, formatWalletAddress } from './types';
import { getImageWithFallback, getNextGatewayUrl, PLACEHOLDER_IMAGE, cleanIpfsUrl, IPFS_GATEWAYS } from '../../utils/ipfs';

interface NFTCardProps {
  nft: NFT;
  isOwned?: boolean;
  onBuyClick: (nft: NFT) => void;
  account?: string | null;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, isOwned = false, onBuyClick, account }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRY = 3;

  // Si es propiedad del usuario actual
  const isOwnedByUser = account && nft.owner && account.toLowerCase() === nft.owner.toLowerCase();
  
  // Inicializar la imagen cuando cambia el NFT
  useEffect(() => {
    if (nft?.image) {
      // Verificar si la imagen ya incluye un gateway IPFS
      if (nft.image.startsWith('http') && IPFS_GATEWAYS.some(gw => nft.image.includes(gw))) {
        // Agregar timestamp para evitar caché
        const timestamp = Date.now();
        const separator = nft.image.includes('?') ? '&' : '?';
        setImageSrc(`${nft.image}${separator}_t=${timestamp}`);
      } else {
        // Usar cleanIpfsUrl para otros casos
        setImageSrc(cleanIpfsUrl(nft.image));
      }
      setRetryCount(0);
      console.log(`NFTCard - Imagen original: ${nft.image} → procesada: ${imageSrc}`);
    }
  }, [nft?.image]);

  // Manejar errores de carga de imagen
  const handleImageError = () => {
    console.warn(`Error al cargar imagen ${imageSrc} - Intento ${retryCount + 1}/${MAX_RETRY}`);
    
    if (retryCount < MAX_RETRY) {
      // Intentar con el siguiente gateway
      const nextUrl = getNextGatewayUrl(imageSrc);
      console.log(`Cambiando a gateway alternativo: ${nextUrl}`);
      setImageSrc(nextUrl);
      setRetryCount(prev => prev + 1);
    } else {
      // Si todos los intentos fallan, usar imagen de placeholder
      console.error(`Error persistente al cargar imagen después de ${MAX_RETRY} intentos`);
      setImageSrc(PLACEHOLDER_IMAGE);
    }
  };

  return (
    <Card maxW="sm" transition="transform 0.3s" _hover={{ transform: 'scale(1.02)' }}>
      <CardBody>
        <Box>
          <AspectRatio ratio={1}>
            <Image
              src={imageSrc || PLACEHOLDER_IMAGE}
              alt={`${nft.name}`}
              objectFit="cover"
              fallback={<Skeleton height="100%" width="100%" />}
              onError={handleImageError}
              borderTopRadius="lg"
            />
          </AspectRatio>
        </Box>
        <Stack mt="6" spacing="3">
          <Heading size="md">{nft.name}</Heading>
          <Text>
            {nft.description || 'Sin descripción'}
          </Text>
          <HStack justifyContent="space-between">
            <Badge colorScheme="green" fontSize="md">
              {nft.price} MATIC
            </Badge>
            {isOwned && (
              <Tooltip label="Este NFT es tuyo">
                <Badge colorScheme="purple" fontSize="md">
                  Mi NFT
                </Badge>
              </Tooltip>
            )}
            {nft.owner && !isOwned && (
              <Tooltip label={`Propietario: ${nft.owner}`}>
                <Badge colorScheme="blue" fontSize="md">
                  {formatWalletAddress(nft.owner)}
                </Badge>
              </Tooltip>
            )}
          </HStack>
        </Stack>
      </CardBody>
      <Divider />
      <CardFooter>
        {isOwned ? (
          <Button 
            variant="solid" 
            colorScheme="blue" 
            width="100%"
            rightIcon={<ExternalLinkIcon />}
            as="a"
            href={`https://polygonscan.com/token/${nft.contractAddress}?a=${nft.tokenId}`}
            target="_blank"
          >
            Ver en Polygonscan
          </Button>
        ) : account ? (
          <Button 
            variant="solid" 
            colorScheme="green" 
            width="100%"
            onClick={() => onBuyClick(nft)}
          >
            Comprar NFT
          </Button>
        ) : (
          <Tooltip label="Necesitas conectar tu wallet para comprar este NFT">
            <Button 
              variant="solid" 
              colorScheme="blue" 
              width="100%"
              onClick={() => window.dispatchEvent(new CustomEvent('connect-wallet-required'))}
            >
              Conectar Wallet
            </Button>
          </Tooltip>
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
