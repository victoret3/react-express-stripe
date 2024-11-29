import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Heading, Text, Grid, Image } from '@chakra-ui/react';
import { collections } from '../config/CollectionConfig';

const CollectionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = collections.find((col) => col.slug === slug);

  if (!collection) {
    return (
      <Box p={5}>
        <Heading>404 - Colección no encontrada</Heading>
        <Text>La colección que buscas no existe.</Text>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading>{collection.name}</Heading>

      {/* Renderización del descriptionLong */}
      <Box my={3}>
        {Array.isArray(collection.descriptionLong) ? (
          collection.descriptionLong.map((paragraph, index) => (
            <Text key={index} mt={index > 0 ? 4 : 0}>
              {paragraph}
            </Text>
          ))
        ) : (
          <Text>{collection.descriptionLong}</Text>
        )}
      </Box>

      {/* Galería de obras */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
        {collection.obras.map((obra) => (
          <Box key={obra.titulo} borderWidth="1px" borderRadius="lg" overflow="hidden">
            {obra.imagen && <Image src={obra.imagen} alt={obra.titulo} />}
            <Box p={4}>
              <Heading size="md">{obra.titulo}</Heading>
              <Text>{obra.fecha}</Text>
            </Box>
          </Box>
        ))}
      </Grid>
    </Box>
  );
};

export default CollectionPage;
