import React from 'react';
import {
  Box,
  Flex,
  Image,
  HStack,
  useBreakpointValue,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu';
import CartSummary from './CartSummary';
import firmaImage from '../assets/firmaNani.png';
import Footer from './Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Función que determina color de fondo y filtro en base a la ruta
  const getHeaderStyles = () => {
    // Valores por defecto para móvil
    let bgColor = 'transparent';
    let filterStyle = 'invert(1) brightness(1)';

    if (location.pathname.includes('/mi-obra')) {
      bgColor = 'brand.primary';  // Coral para "Mi Obra"
      filterStyle = 'brightness(0) invert(1)';
    } else if (location.pathname.includes('/tienda-online')) {
      bgColor = 'brand.accent1';  // Azul cielo para "Tienda Online"
      filterStyle = 'brightness(0) invert(1)';
    } else if (location.pathname.includes('/sobre-mi')) {
      bgColor = 'black';          // Negro para "Sobre Mi"
      filterStyle = 'brightness(0) invert(1)';
    } else if (location.pathname.includes('/comunidad')) {
      bgColor = 'brand.accent4';  // Naranja claro para NFTs
      filterStyle = 'brightness(0) invert(1)';
    } else if (location.pathname.includes('/coleccion/')) {
      bgColor = '#1A202C';        // Azul oscuro para colecciones
      filterStyle = 'brightness(0) invert(1)';
    }

    return { bgColor, filterStyle };
  };

  const { bgColor, filterStyle } = getHeaderStyles();

  // Para móvil se respeta el color según la ruta;
  // Para escritorio (md en adelante) forzamos transparencia y un filtro más "neutral"
  const responsiveBgColor = useBreakpointValue({ base: bgColor, md: 'transparent' });
  const responsiveFilter = useBreakpointValue({ base: filterStyle, md: 'invert(1) brightness(1)' });

  return (
    <Flex direction="column" minH="100vh">
      {/* Barra superior */}
      <Flex
        as="header"
        alignItems="center"
        justifyContent="flex-end"
        position="absolute"
        top="0"
        right="0"
        left="0"
        w="100%"
        maxW="100%"
        zIndex={10}
        minH="80px"
        px={{ base: "1rem", md: "2rem" }}
        bg={responsiveBgColor}
        boxShadow={responsiveBgColor !== 'transparent' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'}
        gap="1rem"
        overflow="hidden"
      >
        {/* Imagen de firma, alineada a la izquierda */}
        <Box position="absolute" top={{ base: '-1.5rem', sm: '-1.5rem', md: '-1.5rem' }} left={{ base: '1rem', md: '2rem' }} display={{ base: 'block', md: 'none' }}>
          <RouterLink to="/">
            <Image
              src={firmaImage}
              alt="Firma"
              mt="2rem"
              width={{ base: '6rem', sm: '5rem', md: '6rem' }}
              filter={responsiveFilter}
            />
          </RouterLink>
        </Box>

        {/* Enlaces (si los llegas a activar) */}
        <HStack
          spacing={6}
          position="absolute"
          left="calc(50% - 100px)"
          display={{ base: 'none', md: 'flex' }}
        >
          {/* Aquí irían tus enlaces de escritorio */}
        </HStack>

        {/* Carrito */}
        <Box>
          <CartSummary filter={responsiveFilter} />
        </Box>

        {/* Menú hamburguesa */}
        <Box>
          <HamburgerMenu filter={responsiveFilter} />
        </Box>
      </Flex>

      {/* Contenido principal */}
      <Box as="main" flex="1">
        {children}
      </Box>

      {/* Footer */}
      <Footer />
    </Flex>
  );
};

export default Layout;