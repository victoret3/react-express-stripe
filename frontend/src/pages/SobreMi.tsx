import React from "react";
import {
  Box,
  Image,
  Heading,
  Text,
  Flex,
  Icon,
  SimpleGrid,
  useColorModeValue,
  useBreakpointValue,

} from "@chakra-ui/react";
import { FaQuoteLeft } from "react-icons/fa";
import headerImage from "../assets/nani.jpg";

// 1) IMPORTAMOS todas las imágenes de prensa
import prensa01 from "../assets/Prensa/Prensa01.jpg";
import prensa02 from "../assets/Prensa/prensa02.jpg";
import prensa03 from "../assets/Prensa/prensa03.jpg";
import prensa04 from "../assets/Prensa/prensa04.jpg";
import prensa05 from "../assets/Prensa/prensa05.jpg";
import prensa06 from "../assets/Prensa/prensa06.jpg";
import prensa07 from "../assets/Prensa/prensa07.jpg";
import prensa08 from "../assets/Prensa/prensa08.jpg";
import prensa09 from "../assets/Prensa/prensa09.jpg";
import prensa10 from "../assets/Prensa/prensa10.jpg";
import prensa11 from "../assets/Prensa/prensa11.jpg";
import prensa12 from "../assets/Prensa/prensa12.jpg";
import prensa13 from "../assets/Prensa/prensa13.jpg";
import prensa14 from "../assets/Prensa/prensa14.jpg";
import prensa15 from "../assets/Prensa/prensa15.jpg";
import prensa16 from "../assets/Prensa/prensa16.jpg";
import prensa17 from "../assets/Prensa/prensa17.jpg";

const SobreMi: React.FC = () => {
  // 2) CREAMOS un array con las imágenes para mapearlas
  const pressImages = [
    prensa01,
    prensa02,
    prensa03,
    prensa04,
    prensa05,
    prensa06,
    prensa07,
    prensa08,
    prensa09,
    prensa10,
    prensa11,
    prensa12,
    prensa13,
    prensa14,
    prensa15,
    prensa16,
    prensa17,
  ];
  const columnCount = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  return (
    <Box>
      {/* Cabecera con imagen de fondo */}
      <Box position="relative" w="100%" h="100vh" bg="gray.800" overflow="hidden">
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
          top={{ base: 0, lg: "0" }}
          left={{ base: "0", lg: "0" }}
          h={{ base: "5rem", lg: "100%" }}
          w={{ base: "100%", lg: "7rem" }}
          bg="brand.accent2"
          zIndex={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Heading
            fontSize={{ base: "1.5rem", lg: "2rem" }}
            color="brand.accent3"
            textAlign="center"
            sx={{
              writingMode: { base: "horizontal-tb", lg: "vertical-rl" },
              transform: { base: "none", lg: "rotate(180deg)" },
            }}
          >
            Sobre mí
          </Heading>
        </Box>

        {/* Texto superpuesto en la cabecera */}
        <Flex
          position="absolute"
          bottom="0%"
          left="50%"
          transform="translate(-50%, 0)"
          zIndex={3}
          color="white"
          textAlign="center"
          flexDirection="column"
          alignItems="center"
          px="1rem"
          width={{ base: "100vw", lg: "55rem" }}
        >
          {/* Icono de quotes */}
          <Icon
            as={FaQuoteLeft}
            boxSize={{ base: "2rem", lg: "3rem" }}
            color="whiteAlpha.800"
            mb={2}
          />

          <Heading
            as="h1"
            size="md"
            lineHeight="1.5rem"
            fontSize={{ base: "1rem", lg: "1.25rem" }}
            fontWeight="normal"
            letterSpacing="0.1rem"
            px="1rem"
            pb={{ base: "4rem", lg: "5rem" }}
          >
            Me complace sentirme como un perpetuo extranjero. Un escultor en el
            cuerpo de un pintor y un pintor cuando esculpo; pero, ante todo, soy
            un aprendiz en rebeldía…
          </Heading>
        </Flex>
      </Box>

      {/* Texto debajo de la cabecera */}
      <Box px={{ base: "1rem", md: "3rem", lg: "5rem" }} py="3rem">
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify">
          <strong>Nani Boronat. Barcelona 1968</strong>
        </Text>
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
          Bernardino Boronat Mas reside en Múnich desde 2007. El cambiante trabajo
          de su padre le llevó a nacer en Barcelona, ciudad donde vivió hasta sus
          cuatro años. Valencia será su siguiente destino, origen de sus
          progenitores y la ciudad con la que más identificado se siente. Al
          cumplir los quince años su familia fija su residencia definitiva en
          Madrid, donde Boronat se formará profesionalmente. Entre 1988 y 1990
          regresa a Valencia para estudiar en la escuela de arquitectura de la
          Universidad Politécnica (U.P.V). Pero la falta de vocación por la
          arquitectura hará que abandone esta disciplina y solicite su ingreso en
          Facultad de Bellas Artes (Universidad Complutense de Madrid),
          licenciándose en 1996 bajo la especialidad de pintura.
        </Text>
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
          En 1992 obtiene una beca durante el primer semestre del segundo curso
          que le llevará a estudiar en el Loras College de Dubuque, Iowa. Finaliza
          la carrera de Bellas Artes becado por el programa Erasmus en la
          Universität Geschamthochschule de Kassel, Alemania. En 1996 inicia una
          extensa carrera como pintor y escultor, exponiendo tanto individual como
          colectivamente en salas y ferias de España y Portugal, de Alemania,
          Suiza, Holanda y los Estados Unidos. Parte de su obra se encuentra hoy
          en los fondos de galerías y museos así como en colecciones privadas.
        </Text>
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
          Ha colaborado con artistas de otras disciplinas: arquitectos,
          paisajistas y músicos. Desde hace más de dos décadas mantiene en
          paralelo a su proyección artística la actividad como fotógrafo
          especializado en arquitectura. Recientemente se ha publicado su primer
          ensayo sobre fotografía titulado <em>La musa precoz: la fotografía como
          fenómeno antropológico</em>.
        </Text>
        <Text fontSize="lg" lineHeight="1.8" textAlign="justify" mt={4}>
          La trayectoria de Nani Boronat ha estado marcada por los diferentes
          lugares en los que ha residido: España, los Estados Unidos y Alemania.
          En la actualidad, junto a su esposa, la pianista azerbayana Ulviya
          Abdullayeva, desarrolla un vasto proyecto que bajo el título{" "}
          <em>“De la Alhambra al Shirvanshah”</em> propone un enlace cultural de
          dimensión artístico-antropológica entre sus culturas nativas: la ibérica
          y la azerí. Desarrollando una serie de obras en las que, bajo la fusión
          de la música, la pintura y la escultura, Abdullayeva y Boronat nutren el
          proyecto de materiales que extraen de las fuentes folclóricas, clásicas
          y contemporáneas de sus respectivas tradiciones.
        </Text>
      </Box>

      {/* SECCIÓN DE PRENSA */}
      <Box px={{ base: "1rem", md: "3rem", lg: "5rem" }} pb="3rem">
        <Heading as="h2" size="lg" mb={4}>
          Notas de prensa
        </Heading>

        {/* 
          MASONRY LAYOUT 
          1) Establecemos column-count dinámico con breakpoints.
          2) breakInside: 'avoid' para que las imágenes no se corten.
        */}
        <Box
          style={{
            columnCount: columnCount,
            columnGap: "1rem",
          }}
        >
          {pressImages.map((imgSrc, i) => (
            <Box
              key={i}
              mb="1rem"
              sx={{
                breakInside: "avoid",       // Firefox
                WebkitColumnBreakInside: "avoid", // Chrome/Safari
                pageBreakInside: "avoid",   // IE/Edge
              }}
              borderRadius="md"
              overflow="hidden"
              boxShadow="md"
              bg="white"
            >
              <Image
                src={imgSrc}
                alt={`Nota de prensa ${i + 1}`}
                w="100%"
                display="block"
                // Con "objectFit" y "display: block", la imagen se adapta a su contenedor.
                objectFit="cover"
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SobreMi;