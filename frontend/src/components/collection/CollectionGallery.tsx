import React, { useState } from 'react';
import {
  SimpleGrid,
  Box,
  Image,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  useToast,
  Center
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { CollectionInfo } from '../../utils/collectionContract';
import { getImageWithFallback, PLACEHOLDER_IMAGE } from '../../utils/ipfs';
import { Link, useNavigate } from 'react-router-dom';

interface CollectionGalleryProps {
  collections: CollectionInfo[];
  onSelectCollection: (collection: CollectionInfo) => void;
  isAdmin: boolean;
}

const CollectionGallery: React.FC<CollectionGalleryProps> = ({
  collections,
  onSelectCollection,
  isAdmin
}) => {
  const toast = useToast();

  if (collections.length === 0) {
    return (
      <Center py={10}>
        <Text fontSize="xl">No hay colecciones disponibles en este momento</Text>
      </Center>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {collections.map((collection) => (
        <Box
          key={collection.collectionAddress}
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          p={4}
          _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
        >
          <VStack align="stretch" spacing={4}>
            <Box position="relative" height="200px">
              <Image
                src={getImageWithFallback(collection.imageCid)}
                alt={collection.name}
                objectFit="cover"
                width="100%"
                height="100%"
                fallbackSrc={PLACEHOLDER_IMAGE}
                onError={(e) => {
                  console.error(`Error cargando imagen de colección ${collection.name}:`, e);
                  // @ts-ignore
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            </Box>

            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">
                  {collection.name}
                </Text>
                <Badge colorScheme="purple">{collection.symbol}</Badge>
              </HStack>

              <Text color="gray.600" noOfLines={3}>
                {collection.description}
              </Text>

              <HStack justify="space-between" mt={4}>
                <Button
                  as={Link}
                  to={`/collection/${collection.collectionAddress}`}
                  colorScheme="blue"
                  size="sm"
                >
                  Ver colección
                </Button>

                {isAdmin && (
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="green"
                    size="sm"
                    onClick={() => onSelectCollection(collection)}
                  >
                    Añadir NFT
                  </Button>
                )}
              </HStack>
            </VStack>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default CollectionGallery;