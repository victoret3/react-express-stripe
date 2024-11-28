import React, { useState } from 'react';
import {
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Flex,
  SimpleGrid,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botón de menú hamburguesa */}
      <IconButton
        icon={<HamburgerIcon />}
        position="absolute"
        top="20px"
        right="20px"
        onClick={toggleDrawer}
        aria-label="Abrir menú"
        colorScheme="transparent"
        zIndex={10} 

      />

      {/* Menú lateral */}
      <Drawer isOpen={isOpen} placement="right" onClose={toggleDrawer}>
        <DrawerOverlay />
        <DrawerContent
          h="100vh"
          maxW={{ base: '100vw', lg: '30rem' }} // Ocupa toda la pantalla en mobile
          bg="rgba(0, 0, 0, 0.9)" // Fondo oscuro
          color="white"
        >
          <DrawerCloseButton />
          {/* Enlaces del menú centrados verticalmente */}
          <DrawerBody display="flex" justifyContent="center" alignItems="center">
            <VStack spacing={6} align="center" fontSize="3xl"> {/* Centrado */}
              <Link to="/sobre-mi">Sobre mí</Link>
              <Link to="/mi-obra">Mi obra</Link>
              <Link to="/tienda-online">Tienda online</Link>
              <Link to="/nfts">NFTs</Link>
            </VStack>
          </DrawerBody>

          {/* Enlaces sociales al fondo */}
          <SimpleGrid
  columns={{ base: 2, md: 4 }} // 2 columnas en mobile, 4 columnas en desktop
  spacing={4} // Espaciado entre elementos
  mb={{ base: "2rem", md: "1rem" }}
  justifyContent="center"
  alignItems="center"
  textAlign="center" // Centrar texto dentro de cada celda
  p={4}
  w="100%" // Asegura que ocupe todo el ancho
>
  <ChakraLink
    href="https://linkedin.com"
    isExternal
    fontSize="0.8rem"
    textAlign="center"
  >
    LinkedIn
  </ChakraLink>
  <ChakraLink
    href="https://instagram.com"
    isExternal
    fontSize="0.8rem"
    textAlign="center"
  >
    Instagram
  </ChakraLink>
  <ChakraLink
    href="https://twitter.com"
    isExternal
    fontSize="0.8rem"
    textAlign="center"
  >
    Twitter
  </ChakraLink>
  <ChakraLink
    href="mailto:contacto@correo.com"
    isExternal
    fontSize="0.8rem"
    textAlign="center"
  >
    Contacto
  </ChakraLink>
</SimpleGrid>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
