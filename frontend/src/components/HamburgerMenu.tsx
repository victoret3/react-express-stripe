import React, { useState } from 'react';
import {
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Box,
  SimpleGrid,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Función para cerrar el menú al hacer clic en un enlace
  const closeDrawer = () => setIsOpen(false);

  return (
    <>
     <Box position="relative">
  <IconButton
    icon={<HamburgerIcon />}
    aria-label="Abrir menú"
    onClick={toggleDrawer}
    position="relative" // Asegura que la posición funcione correctamente
    zIndex={10}
  />
</Box>


      {/* Menú lateral */}
      <Drawer isOpen={isOpen} placement="right" onClose={toggleDrawer}>
        <DrawerOverlay />
        <DrawerContent
          h="100vh"
          maxW={{ base: '100vw', lg: '30rem' }}
          bg="rgba(0, 0, 0, 0.9)"
          color="white"
        >
          <DrawerCloseButton />
          {/* Enlaces del menú centrados verticalmente */}
          <DrawerBody display="flex" justifyContent="center" alignItems="center">
            <VStack spacing={6} align="center" fontSize="3xl">
              <Link to="/sobre-mi" onClick={closeDrawer}>Sobre mí</Link>
              <Link to="/mi-obra" onClick={closeDrawer}>Mi obra</Link>
              <Link to="/tienda-online" onClick={closeDrawer}>Tienda online</Link>
              <Link to="/nfts" onClick={closeDrawer}>NFTs</Link>
            </VStack>
          </DrawerBody>

          {/* Enlaces sociales al fondo */}
          <SimpleGrid
            columns={{ base: 2, md: 4 }}
            spacing={4}
            mb={{ base: '2rem', md: '1rem' }}
            justifyContent="center"
            alignItems="center"
            textAlign="center"
            p={4}
            w="100%"
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
