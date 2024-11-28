import React from 'react';
import { Box, Image, Text } from '@chakra-ui/react';

interface Obra {
  imagen: string;
  titulo: string;
  fecha: string;
  collection: string;
}

const ObraCard: React.FC<{ obra: Obra }> = ({ obra }) => {
  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="md"
      boxShadow="lg"
      transition="transform 0.3s ease"
      _hover={{ transform: 'scale(1.05)' }}
    >
      {/* Imagen */}
      <Image src={obra.imagen} alt={obra.titulo} w="100%" h="15rem" objectFit="cover" />

      {/* Franja semitransparente */}
      <Box
        position="absolute"
        bottom="0"
        w="100%"
        bg="rgba(255, 255, 255, 0.7)" // Semitransparente
        p="0.5rem"
        textAlign="center"
      >
        <Text fontWeight="bold" fontSize="lg">
          {obra.titulo}
        </Text>
       
      </Box>
    </Box>
  );
};

export default ObraCard;
