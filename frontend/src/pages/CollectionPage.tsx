import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import { obras } from '../config/ObraConfig';
import ObraCard from '../components/ObraCard';

const CollectionPage: React.FC = () => {
  const { collectionName } = useParams<{ collectionName: string }>(); // Obtener el nombre de la colección de la URL

  // Filtrar las obras que pertenecen a la colección
  const obrasFiltradas = obras.filter((obra) => obra.collection === collectionName);

  return (
    <Box px="3rem" py="2rem">
      <Heading as="h1" size="lg" mb="2rem">
        {collectionName} {/* Título de la colección */}
      </Heading>

      {/* Mostrar las obras de la colección */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing="2rem">
        {obrasFiltradas.map((obra) => (
          <ObraCard key={obra.titulo} obra={obra} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default CollectionPage;
