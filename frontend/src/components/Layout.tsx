import React from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu';
import CartSummary from './CartSummary';
import firmaImage from '../assets/firmaNani.png';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {/* Barra superior con carrito y menú */}
      <Flex
        as="header"
        alignItems="center"
        justifyContent="flex-end" // Todos los elementos alineados al borde derecho
        p={4}
        bg="transparent" // Fondo transparente
        position="absolute"
        top="0"
        right="0"
        w="100%" // Ocupa todo el ancho
        zIndex={10} // Asegura que esté encima de otros elementos
        gap="1rem" // Espaciado entre elementos
      >
        {/* Imagen de firma como enlace */}
        <Box position="absolute" top={{ base: "-0.7rem", sm: "-1.5rem", md: "-1.5rem" }} left={{ base: "2rem", sm: "2rem", md: "4rem", lg: "10rem" }}>
          <RouterLink to="/">
            <Image
              src={firmaImage}
              alt="Firma"
              width={{ base: "3rem", sm: "3rem", md: "4rem" }}
              transform="rotate(-90deg)"
              mb="1rem"
            />
          </RouterLink>
        </Box>

        {/* Carrito */}
        <Box>
          <CartSummary />
        </Box>

        {/* Menú hamburguesa */}
        <Box>
          <HamburgerMenu />
        </Box>
      </Flex>

      {/* Contenido principal */}
      <Box as="main">{children}</Box>
    </>
  );
};

export default Layout;
