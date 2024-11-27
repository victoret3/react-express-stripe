import React from 'react';
import { Box, Image, Text, Flex } from '@chakra-ui/react';
import portadaImage from '../assets/boronat.webp';
import firmaImage from '../assets/firmaNani.png';
import HamburgerMenu from '../components/HamburgerMenu';

const Home: React.FC = () => {
  return (
    <Box position="relative" w="100vw" h="100vh" overflow="hidden">
      {/* Imagen de fondo con overlay */}
      <Box position="relative" w="100%" h="100%">
        <Image
          src={portadaImage}
          alt="Imagen de portada"
          objectFit="cover"
          w="100%"
          h="100%"
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.5)" // Oscurece la imagen con un fondo semi-transparente
        />
      </Box>

      {/* Menú hamburguesa */}
      <HamburgerMenu />

      {/* Contenedor para imagen de firma y texto */}
      <Flex
        position="absolute"
        bottom="0"
        left="0"
        pl={{ base: "1rem", md: "2rem", lg: "15rem" }} // Paddings en lugar de margins
        pb={{ base: "20vw", md: "5rem", lg: "3rem" }}
        direction="column"
        align={{ base: "center", lg: "flex-start" }} // Centrado en mobile
        w="100%" // Asegura ancho completo
        color="white"
      >
        {/* Imagen de firma */}
        <Image
          src={firmaImage}
          alt="Firma"
          width={{ base: "12rem", md: "40vw", lg: "25vw" }} // Se ajusta al tamaño de la pantalla
          ml={{ base: "0", md: "-3rem", lg: "3rem" }} 
          mb={{ base: "0", md: "-8rem", lg: "-10rem" }} 
          filter="invert(1) brightness(2)" // Ajuste para parecer blanca
          transform={{ base: "rotate(0deg)", lg: "rotate(-90deg)" }} // Rotación solo en pantallas grandes
        />
        {/* Texto debajo */}
        <Text
          fontSize={{ base: "sm", md: "1.5rem", lg: "1.5rem" }}
          fontWeight="bold"
          textAlign={{ base: "center", lg: "left" }} // Centrado en mobile
          p={{ base: "1rem", lg: "0rem" }} // Centrado en mobile
        >
          Bernardino Boronat Mas (Nani Boronat), Barcelona 1968.
        </Text>
      </Flex>
    </Box>
  );
};

export default Home;
