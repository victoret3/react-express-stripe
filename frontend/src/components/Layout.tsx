import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import HamburgerMenu from './HamburgerMenu';
import CartSummary from './CartSummary';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {/* Barra superior con menú y carrito */}
      <Flex as="header" justifyContent="space-between" alignItems="center" p={4} bg="gray.800" color="white">
        <HamburgerMenu />
        <CartSummary />
      </Flex>
      {/* Contenido principal */}
      <Box as="main">{children}</Box>
    </>
  );
};

export default Layout;
