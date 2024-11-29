import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import HamburgerMenu from './HamburgerMenu';
import CartSummary from './CartSummary';

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
