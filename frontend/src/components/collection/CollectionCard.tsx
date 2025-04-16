import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  Badge,
  HStack,
  Button,
  Card,
  CardBody,
  Stack,
  Divider,
  CardFooter,
  Tooltip
} from '@chakra-ui/react';
import { AddIcon, ViewIcon } from '@chakra-ui/icons';
import { CollectionInfo } from '../../utils/collectionContract';
import { formatWalletAddress } from '../nft/types';
import { Link } from 'react-router-dom';
import { Collection } from '../../types/Collection';
import { getImageWithFallback, getNextGatewayUrl, PLACEHOLDER_IMAGE, IPFS_GATEWAYS } from '../../utils/ipfs';

interface CollectionCardProps {
  collection: Collection;
  account?: string | null;
  onViewClick: (collection: CollectionInfo) => void;
  onAddNFTClick?: (collection: CollectionInfo) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  account,
  onViewClick,
  onAddNFTClick
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  
  const isOwnedByUser = account && collection.owner && account.toLowerCase() === collection.owner.toLowerCase();
  
  // Obtener la imagen cuando se cargue el componente o cambie la colección
  useEffect(() => {
    // Convertir la URL de IPFS a URL de gateway HTTP
    console.log('CollectionCard - Imagen original:', collection.image);
    
    // Manejar todos los casos posibles
    let imageUrl = PLACEHOLDER_IMAGE;
    
    // Si la imagen existe
    if (collection.image) {
      // Aplicar siempre getImageWithFallback para asegurar que nunca usamos ipfs://
      imageUrl = getImageWithFallback(collection.image);
      
      // Última verificación de seguridad
      if (imageUrl.startsWith('ipfs://')) {
        console.error('ERROR: URL sigue siendo ipfs:// después de transformación:', imageUrl);
        const cleanCID = imageUrl.replace('ipfs://', '');
        imageUrl = `${IPFS_GATEWAYS[0]}${cleanCID}`;
      }
    }
    
    console.log('CollectionCard - Imagen transformada:', imageUrl);
    
    setImageSrc(imageUrl);
    setRetryCount(0);
    setCurrentGatewayIndex(0);
  }, [collection]);
  
  const handleImageError = () => {
    console.log(`Error al cargar la imagen de colección (intento ${retryCount + 1}):`, collection.image);
    
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
  
  const date = new Date(collection.timestamp * 1000).toLocaleDateString();
  
  return (
    <Card 
      maxW="sm" 
      transition="transform 0.3s" 
      _hover={{ transform: 'scale(1.02)' }}
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <CardBody>
        <Box position="relative">
          <Image
            src={imageSrc}
            alt={collection.name}
            borderRadius="lg"
            h="200px"
            w="100%"
            objectFit="cover"
            onError={handleImageError}
          />
          <HStack 
            position="absolute" 
            top="2" 
            right="2" 
            spacing={2}
          >
            {isOwnedByUser && (
              <Tooltip label="Esta colección es tuya">
                <Badge colorScheme="purple" fontSize="0.8em" p={1}>
                  Mi colección
                </Badge>
              </Tooltip>
            )}
            {collection.owner && (
              <Tooltip label={`Propietario: ${collection.owner}`}>
                <Badge colorScheme="blue" fontSize="0.8em" p={1}>
                  {formatWalletAddress(collection.owner)}
                </Badge>
              </Tooltip>
            )}
          </HStack>
        </Box>
        
        <Stack mt="6" spacing="3" flex="1">
          <Heading size="md">{collection.name}</Heading>
          <Text>
            {collection.description || 'Sin descripción disponible'}
          </Text>
          <Text color="blue.600" fontSize="md">
            {collection.nfts?.length || 0} NFTs en esta colección
          </Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button 
          as={Link} 
          to={`/collection/${collection.address}`}
          variant="solid" 
          colorScheme="blue" 
          width="100%"
        >
          Ver colección
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CollectionCard;
