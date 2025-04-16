import React from 'react';
import { SimpleGrid, Text, Box, Center, Spinner } from '@chakra-ui/react';
import NFTCard from './NFTCard';
import { NFT } from './types';

interface NFTGalleryProps {
  nfts: NFT[];
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  onBuyClick: (nft: NFT) => void;
  isMyCollection?: boolean;
  account?: string | null;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({
  nfts,
  isLoading,
  isEmpty,
  emptyMessage,
  onBuyClick,
  isMyCollection = false,
  account
}) => {
  // Renderizar estado de carga
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }

  // Renderizar mensaje si no hay NFTs
  if (isEmpty) {
    return (
      <Center py={10}>
        <Text fontSize="lg" color="gray.500">
          {emptyMessage}
        </Text>
      </Center>
    );
  }

  // Renderizar la galería de NFTs
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} py={4}>
      {nfts.map((nft) => (
        <Box key={nft.tokenId}>
          <NFTCard
            nft={nft}
            isOwned={isMyCollection}
            onBuyClick={onBuyClick}
            account={account}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default NFTGallery;
