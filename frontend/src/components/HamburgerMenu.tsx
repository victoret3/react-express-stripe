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
  useBreakpointValue
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { FaLinkedin, FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

interface HamburgerMenuProps {
  filter?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ filter }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Estilo responsivo para el icono
  const iconColor = useBreakpointValue({ base: "white", md: "black" });
  const iconStyle = useBreakpointValue({
    base: {
      // Para móvil: icono blanco sin sombra
    },
    md: {
      // Para escritorio: icono negro con borde blanco
      backgroundColor: 'white',
      padding: '8px',
      borderRadius: '4px',
      outline: '1px solid black',
      boxShadow: '0 0 0 1px black'
    }
  });

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Función para cerrar el menú al hacer clic en un enlace
  const closeDrawer = () => setIsOpen(false);

  return (
    <>
     <Box position="relative">
       <Box display="inline-block" style={iconStyle}>
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Abrir menú"
          onClick={toggleDrawer}
          variant="ghost"
          size="md"
          color={iconColor}
          bg="transparent"
          _hover={{ 
            bg: 'whiteAlpha.200'
          }}
          _active={{ bg: 'none' }}
          _focus={{ boxShadow: 'none' }}
        />
       </Box>
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
          {/* Botón para cerrar el menú */}
          <DrawerCloseButton color="white" zIndex={11} />

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
              <Link to="/lazy-mint" onClick={closeDrawer}>
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
              fontSize="1.5rem"
              textAlign="center"
              _hover={{ color: "brand.accent2" }}
            >
              <FaLinkedin />
            </ChakraLink>
            <ChakraLink
              href="https://instagram.com"
              isExternal
              fontSize="1.5rem"
              textAlign="center"
              _hover={{ color: "brand.accent2" }}
            >
              <FaInstagram />
            </ChakraLink>
            <ChakraLink
              href="https://twitter.com"
              isExternal
              fontSize="1.5rem"
              textAlign="center"
              _hover={{ color: "brand.accent2" }}
            >
              <FaTwitter />
            </ChakraLink>
            <ChakraLink
              href="mailto:contacto@correo.com"
              isExternal
              fontSize="1.5rem"
              textAlign="center"
              _hover={{ color: "brand.accent2" }}
            >
              <FaEnvelope />
            </ChakraLink>
          </SimpleGrid>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
