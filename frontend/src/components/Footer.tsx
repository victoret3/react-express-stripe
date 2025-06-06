import React from "react";
import { Box, Flex, Text, Link, Image, useBreakpointValue, SimpleGrid, Stack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import logo from '../assets/firmaNani.png';

const Footer: React.FC = () => {
  const logoSize = useBreakpointValue({ base: "180px", md: "260px" });

  return (
    <Box
      as="footer"
      bg="gray.800"
      color="white"
      py={10}
      px={{ base: 4, md: 8 }}
      borderTop="1px solid"
      borderColor="gray.700"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        maxW="container.xl"
        mx="auto"
        gap={8}
      >
        {/* Logo Section */}
        <Box flexShrink={0}>
          <Image
            src={logo}
            alt="Logo"
            boxSize={logoSize}
            objectFit="contain"
            mt={{ base: "-50px", md: -20 }}
            filter="invert(1) brightness(2)"
          />
          <Text fontSize="sm" color="gray.400" mt={{ base: "-20px", md: "-40px" }}>
            Arte contemporáneo y colecciones exclusivas
          </Text>
        </Box>

        {/* Links Grid */}
        <SimpleGrid
          columns={{ base: 2, md: 3 }}
          spacing={{ base: 6, md: 12 }}
          flex={1}
          maxW={{ md: "800px" }}
        >
          {/* Explorar */}
          <Stack spacing={3}>
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              Explorar
            </Text>
            <FooterLink to="/">Inicio</FooterLink>
            <FooterLink to="/tienda-online">Tienda</FooterLink>
            <FooterLink to="/sobre-mi">Sobre Mí</FooterLink>
            <FooterLink to="/mi-obra">Mi Obra</FooterLink>
            <FooterLink to="/comunidad">Comunidad NFT</FooterLink>
          </Stack>

          {/* Legal */}
          <Stack spacing={3}>
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              Legal
            </Text>
            <FooterLink to="/terminos-y-condiciones">Términos</FooterLink>
            <FooterLink to="/politica-de-envio">Envío</FooterLink>
            <FooterLink to="/politica-de-reembolso">Reembolso</FooterLink>
            <FooterLink to="/aviso-legal">Aviso Legal</FooterLink>
          </Stack>

          {/* Contacto */}
          <Stack spacing={3}>
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              Contacto
            </Text>
            <FooterLink to="/contacto">Contacto</FooterLink>
            <Text fontSize="sm" color="gray.400" mt={2}>
              naniboronat@gmail.com
            </Text>
            <Text fontSize="sm" color="gray.400">
              +34 612 34 56 78
            </Text>
          </Stack>
        </SimpleGrid>
      </Flex>

      {/* Copyright */}
      <Box
        mt={8}
        pt={8}
        textAlign="center"
        borderTop="1px solid"
        borderColor="gray.700"
      >
        <Text fontSize="sm" color="gray.400">
          © {new Date().getFullYear()} Nani Boronat. Todos los derechos reservados.
        </Text>
      </Box>
    </Box>
  );
};

// Componente auxiliar para los enlaces
const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    as={RouterLink}
    to={to}
    fontSize="sm"
    color="gray.300"
    _hover={{ color: "teal.300", textDecoration: "none" }}
  >
    {children}
  </Link>
);

export default Footer;