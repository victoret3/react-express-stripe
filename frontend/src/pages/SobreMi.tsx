import React from 'react';
import { Box, Image, Heading, Text, Flex, Icon } from '@chakra-ui/react';
import { FaQuoteLeft } from 'react-icons/fa'; // Importamos el icono de quotes
import headerImage from '../assets/nani.jpg'; // Reemplaza con tu imagen

const SobreMi: React.FC = () => {
  return (
    <Box>
      {/* Cabecera con imagen de fondo */}
      <Box
        position="relative"
        w="100%"
        h="100vh"
        bg="gray.800"
        overflow="hidden"
      >
        {/* Imagen de fondo */}
        <Image
          src={headerImage}
          alt="Imagen de cabecera"
          objectFit="cover"
          objectPosition="center"
          w="100%"
          h="100%"
        />

        {/* Overlay opcional para oscurecer */}
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        />

        {/* Franja lateral o superior */}
        <Box
          position="absolute"
          top={{ base: 0, lg: '0' }} // En móvil, arriba. En escritorio, a la izquierda.
          left={{ base: '0', lg: '0' }}
          h={{ base: '5rem', lg: '100%' }} // Altura completa en escritorio.
          w={{ base: '100%', lg: '7rem' }} // Ancho de la franja en escritorio.
          bg="rgba(0, 0, 0, 0.9)"
          zIndex={2} // Asegura visibilidad por encima del overlay.
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Text
            fontSize={{ base: '1.5rem', lg: '2rem' }}
            color="white"
            textAlign="center"
            sx={{
              writingMode: { base: 'horizontal-tb', lg: 'vertical-rl' }, // Orientación en escritorio y móvil.
              transform: { base: 'none', lg: 'rotate(180deg)' }, // Girar texto en escritorio.
            }}
          >
            Sobre mí
          </Text>
        </Box>

        {/* Header en la cabecera */}
        <Flex
  position="absolute"
  bottom="0%" // Mantén el texto cerca del borde inferior
  left="50%" // Centrado horizontalmente
  transform="translate(-50%, 0)"
  zIndex={3} // Por encima del overlay
  color="white"
  textAlign="center"
  flexDirection="column"
  alignItems="center"
  px="1rem" // Espaciado uniforme en los lados
width={{ base: "100vw", lg: "55rem" }} 
>
  {/* Icono de quotes */}
  <Icon as={FaQuoteLeft} boxSize={{ base: "2rem", lg: "3rem" }} color="whiteAlpha.800" mb={2} />
  
  {/* Ajustes del texto */}
  <Heading
    as="h1"
    size="md"
    lineHeight="1.5rem" // Altura compacta
    fontSize={{ base: "1rem", lg: "1.25rem" }} // Fuente más pequeña en móvil
    fontWeight="normal"
    letterSpacing="0.1rem"
    px="1rem" // Sin espaciado lateral adicional
    pb={{ base: "4rem", lg: "5rem" }}
  >
    Me complace sentirme como un perpetuo extranjero. Un escultor en el cuerpo de un pintor y un pintor cuando esculpo; pero, ante todo, soy un aprendiz en rebeldía…
  </Heading>
</Flex>

      </Box>

      {/* Texto debajo de la cabecera */}
      <Box px={{ base: '1rem', md: '3rem', lg: '5rem' }} py="3rem">
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify">
          Hola, soy Bernardino Boronat Mas (Nani Boronat), nacido en Barcelona
          en 1968. Mi vida ha sido un viaje lleno de arte, creatividad y
          expresión. Durante años, he explorado diferentes técnicas y
          materiales para expresar mis ideas y emociones, reflejando una visión
          única del mundo que me rodea.
        </Text>
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
          Mi trabajo ha sido expuesto en galerías de arte y eventos culturales,
          ganando reconocimiento tanto a nivel local como internacional. Mi
          objetivo es inspirar a otros a través de mi obra, creando un puente
          entre mis emociones y las experiencias de quienes las observan.
        </Text>
      </Box>
    </Box>
  );
};

export default SobreMi;
