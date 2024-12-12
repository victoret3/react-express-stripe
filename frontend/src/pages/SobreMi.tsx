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
          bg="brand.accent2" // Fondo normal amarillo
       
          zIndex={2} // Asegura visibilidad por encima del overlay.
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Heading
            fontSize={{ base: '1.5rem', lg: '2rem' }}
            color="brand.accent3" // Texto azul vibrante            textAlign="center"
            sx={{
              writingMode: { base: 'horizontal-tb', lg: 'vertical-rl' }, // Orientación en escritorio y móvil.
              transform: { base: 'none', lg: 'rotate(180deg)' }, // Girar texto en escritorio.
            }}
          >
            Sobre mí
          </Heading>
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
    <strong>Nani Boronat. Barcelona 1968</strong>
  </Text>
  <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
    Bernardino Boronat Mas reside en Múnich desde 2007. El cambiante trabajo de su padre le llevó a nacer en Barcelona, ciudad donde vivió hasta sus cuatro años. Valencia será su siguiente destino, origen de sus progenitores y la ciudad con la que más identificado se siente. Al cumplir los quince años su familia fija su residencia definitiva en Madrid, donde Boronat se formará profesionalmente. Entre 1988 y 1990 regresa a Valencia para estudiar en la escuela de arquitectura de la Universidad Politécnica (U.P.V). Pero la falta de vocación por la arquitectura hará que abandone esta disciplina y solicite su ingreso en Facultad de Bellas Artes (Universidad Complutense de Madrid), licenciándose en 1996 bajo la especialidad de pintura.
  </Text>
  <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
    En 1992 obtiene una beca durante el primer semestre del segundo curso que le llevará a estudiar en el Loras College de Dubuque, Iowa. Finaliza la carrera de Bellas Artes becado por el programa Erasmus en la Universität Geschamthochschule de Kassel, Alemania. En 1996 inicia una extensa carrera como pintor y escultor, exponiendo tanto individual como colectivamente en salas y ferias de España y Portugal, de Alemania, Suiza, Holanda y los Estados Unidos. Parte de su obra se encuentra hoy en los fondos de galerías y museos así como en colecciones privadas.
  </Text>
  <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
    Ha colaborado con artistas de otras disciplinas: arquitectos, paisajistas y músicos. Desde hace más de dos décadas mantiene en paralelo a su proyección artística la actividad como fotógrafo especializado en arquitectura. Recientemente se ha publicado su primer ensayo sobre fotografía titulado <em>La musa precoz: la fotografía como fenómeno antropológico</em>.
  </Text>
  <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
    La trayectoria de Nani Boronat ha estado marcada por los diferentes lugares en los que ha residido: España, los Estados Unidos y Alemania. En la actualidad, junto a su esposa, la pianista azerbayana Ulviya Abdullayeva, desarrolla un vasto proyecto que bajo el título <em>“De la Alhambra al Shirvanshah”</em> propone un enlace cultural de dimensión artístico-antropológica entre sus culturas nativas: la ibérica y la azerí. Desarrollando una serie de obras en las que, bajo la fusión de la música, la pintura y la escultura, Abdullayeva y Boronat nutren el proyecto de materiales que extraen de las fuentes folclóricas, clásicas y contemporáneas de sus respectivas tradiciones.
  </Text>
</Box>

    </Box>
  );
};

export default SobreMi;
