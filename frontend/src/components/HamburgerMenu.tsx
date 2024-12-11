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
          bg="black"
          color="white"
        >
<DrawerBody display="flex" justifyContent="center" alignItems="center">
  <VStack spacing={6} align="center" fontSize="3xl" width="100%">
    <Link to="/sobre-mi" onClick={closeDrawer}>
      <Box
        as="span"
        bg="brand.accent2" // Fondo normal amarillo
        color="brand.accent3" // Texto azul vibrante
        px={6}
        py={3}
        borderRadius="md"
        fontFamily="heading"
        width="250px" // Ancho fijo
        textAlign="center"
        _hover={{ bg: "brand.accent3", color: "brand.accent2" }} // Hover inverso
        display="inline-block"
      >
        Sobre mí
      </Box>
    </Link>
    <Link to="/mi-obra" onClick={closeDrawer}>
      <Box
        as="span"
        bg="brand.primary" // Fondo normal coral
        color="brand.accent2" // Texto amarillo
        px={6}
        py={3}
        borderRadius="md"
        fontFamily="heading"
        width="250px" // Ancho fijo
        textAlign="center"
        _hover={{ bg: "brand.accent2", color: "brand.primary" }} // Hover inverso
        display="inline-block"
      >
        Mi obra
      </Box>
    </Link>
    <Link to="/tienda-online" onClick={closeDrawer}>
      <Box
        as="span"
        bg="brand.accent1" // Fondo normal azul cielo
        color="brand.primary" // Texto coral
        px={6}
        py={3}
        borderRadius="md"
        fontFamily="heading"
        width="250px" // Ancho fijo
        textAlign="center"
        _hover={{ bg: "brand.primary", color: "brand.accent1" }} // Hover inverso
        display="inline-block"
      >
        Shop
      </Box>
    </Link>
    <Link to="/nfts" onClick={closeDrawer}>
      <Box
        as="span"
        bg="brand.accent4" // Fondo normal naranja claro
        color="brand.accent3" // Texto azul vibrante
        px={6}
        py={3}
        borderRadius="md"
        fontFamily="heading"
        width="250px" // Ancho fijo
        textAlign="center"
        _hover={{ bg: "brand.accent3", color: "brand.accent4" }} // Hover inverso
        display="inline-block"
      >
        Comunidad
      </Box>
    </Link>
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
