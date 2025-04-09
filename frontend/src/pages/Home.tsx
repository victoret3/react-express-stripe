import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import portadaImage from '../assets/boronat.webp';
import firmaImage from '../assets/firmaNani.png';

const Home: React.FC = () => {
  return (
    <Box position="relative" w="100vw" minH={{ base: '90vh', md: '100vh' }} overflow="hidden">
      {/* Imagen de fondo (portada) */}
      <Box
        position="relative"
        w="100%"
        // 90vh en mobile y 100vh a partir de md
        h={{ base: '90vh', md: '100vh' }}
      >
        <Box
          as="img"
          src={portadaImage}
          alt="Imagen de portada"
          objectFit="cover"
          // Mueve la imagen hacia la izquierda en mobile,
          // y en pantallas más grandes, centrada
          objectPosition={['20% center', 'center', 'center']}
          w="100%"
          h="100%"
          loading="eager"
        />
        {/* Overlay oscuro */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.4)"
        />
      </Box>

      {/* Contenedor "fijo" en la esquina inferior izq. con la firma y el texto */}
      <Box
        position="absolute"
        bottom={{ base: '4%', md: '3%' }}
        left={{ base: '4%', md: '5%' }}
        zIndex={1}
        color="white"
      >
        {/* Bloque vertical para la firma y el texto */}
        <Box display="flex" flexDirection="column" alignItems="flex-start">
          {/* Firma como fondo de un Box */}
          <Box
            // Ajusta ancho y alto para ver la firma
            w={{ base: '50vw', md: '30vw' }}
            h={{ base: '20vw', md: '12vw' }}
            backgroundImage={`url(${firmaImage})`}
            backgroundRepeat="no-repeat"
            backgroundSize="contain"
            backgroundPosition="center"
            filter="invert(1) brightness(2)"
          />

          {/* Texto debajo de la firma */}
          <Text
            mt={2}
            fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
            fontWeight="500"
          >
            Bernardino Boronat Mas (Nani Boronat), Barcelona 1968.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;