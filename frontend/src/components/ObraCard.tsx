import React from 'react';
import { Box, Image, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

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
     
    </Box>
  );
};

export default ObraCard;
