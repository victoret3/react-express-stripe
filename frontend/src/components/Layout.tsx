import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import { Box } from '@chakra-ui/react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box>
      {/* Menú hamburguesa siempre visible */}
      <HamburgerMenu />
      {/* Contenido dinámico de las rutas */}
      {children}
    </Box>
  );
};

export default Layout;
