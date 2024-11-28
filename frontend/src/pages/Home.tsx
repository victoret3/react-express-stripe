import React from 'react';
import { Box, Image, Text, Flex } from '@chakra-ui/react';
import portadaImage from '../assets/boronat.webp';
import firmaImage from '../assets/firmaNani.png';

const Home: React.FC = () => {
  return (
    <Box position="relative" w="100vw" h="100vh" overflow="hidden">
      {/* Imagen de fondo con overlay */}
      <Box position="relative" w="100%" h="100%">
        <Image
          src={portadaImage}
          alt="Imagen de portada"
          objectFit="cover"
          objectPosition="15% center" // Posiciona la imagen desplazada hacia la derecha
          w="100%"
          h="100%"
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.4)" 
        />
      </Box>

   

      {/* Contenedor para imagen de firma y texto */}
      <Flex
        position="absolute"
        bottom="0"
        left="0"
        pl={{ base: "1rem", md: "2rem", lg: "15rem" }} 
        pb={{ base: "20vw", md: "5rem", lg: "3rem" }}
        direction="column"
        align={{ base: "center", lg: "flex-start" }} 
        w="100%"
        color="white"
      >
        {/* Imagen de firma */}
        <Image
          src={firmaImage}
          alt="Firma"
          width={{ base: "10rem", md: "40vw", lg: "25vw" }} 
          ml={{ base: "-1.3rem", md: "-3rem", lg: "3rem" }} 
          mb={{ base: "-5rem", md: "-8rem", lg: "-9rem" }} 
          filter="invert(1) brightness(2)" 
          transform="rotate(-90deg)"
        />
        {/* Texto debajo */}
        <Text
          fontSize={{ base: "sm", md: "1rem", lg: "1rem" }}
          fontWeight="bold"
          textAlign={{ base: "center", lg: "left" }} 
          p={{ base: "1rem", lg: "0rem" }}
        >
          Bernardino Boronat Mas (Nani Boronat), Barcelona 1968.
        </Text>
      </Flex>
    </Box>
  );
};

export default Home;
