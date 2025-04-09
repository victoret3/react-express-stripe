import React, { useRef, useState, useEffect, MouseEvent } from "react";
import {
  Box,
  Heading,
  Image,
  Text,
  Flex,
  Icon,
  Link,
  Button,
} from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";

import { collections } from "../config/CollectionConfig";
import ObraCard from "../components/ObraCard";
import headerImage from "../assets/nani.jpg";

/** Componente Slider que maneja su propia ref y estados de arrastre */
const HorizontalSlider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX); // Posición inicial del ratón
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 1.5; // Factor de desplazamiento
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <Flex
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      display="inline-flex"
      whiteSpace="nowrap"
      flexWrap="nowrap"
      overflowX="auto"
      cursor={isDragging ? "grabbing" : "grab"}
      css={{
        "&::-webkit-scrollbar": { display: "none" },
        "-ms-overflow-style": "none", // IE / Edge
        scrollbarWidth: "none",       // Firefox
      }}
    >
      {children}
    </Flex>
  );
};

/** Función para "barajar" un array al estilo Fisher-Yates */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MiObra: React.FC = () => {
  const [filtro, setFiltro] = useState<string>("");
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);

  // Filtrar colecciones si fuera necesario (usando el estado 'filtro')
  const coleccionesFiltradas = filtro
    ? collections.filter((collection) => collection.name === filtro)
    : collections;

  return (
    <Box>
      {/* Cabecera principal */}
      <Box position="relative" w="100%" h="100vh" bg="gray.800" overflow="hidden">
        <Image
          src={headerImage}
          alt="Imagen de cabecera"
          objectFit="cover"
          objectPosition="center"
          w="100%"
          h="100%"
          draggable={false}
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          bg="rgba(0, 0, 0, 0.4)"
          zIndex={1}
        />

        {/* Franja lateral o superior */}
        <Box
          position="absolute"
          top={{ base: "0", md: "0" }}
          
          left={{ base: "0", lg: "0" }}
          h={{ base: "4rem", lg: "100%" }}
          w={{ base: "100%", lg: "7rem" }}
          bg="brand.primary"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={2}
        >
          <Heading
            fontSize={{ base: "1.5rem", lg: "2rem" }}
            color="brand.accent2"
            textAlign="center"
            sx={{
              writingMode: { base: "horizontal-tb", lg: "vertical-rl" },
              transform: { base: "none", lg: "rotate(180deg)" },
            }}
          >
            Mi Obra
          </Heading>
        </Box>

        {/* Contenedor principal */}
        <Flex
          position="absolute"
          top={{ base: "55%", md: "50%" }}
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={3}
          w="90%"
          maxW="1150px"
          direction={{ base: "column", lg: "row" }}
          justify="space-between"
          align="center"
          gap={{ base: "1rem", lg: "2rem" }}
        >
          {/* Lista de colecciones */}
          <Flex
            direction="column"
            bg="rgba(0, 0, 0, 0.8)"
            borderRadius="md"
            p={{ base: "1rem", lg: "2rem" }}
            gap="0rem"
            minW={{ base: "100%", lg: "60%" }}
          >
            {collections.map((collection) => (
              <Flex
                key={collection.slug}
                align="center"
                justify="space-between"
                w="100%"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)", cursor: "pointer" }}
                onMouseEnter={() => setHoveredCollection(collection.slug)}
                onMouseLeave={() => setHoveredCollection(null)}
              >
                <Link
                  as={RouterLink}
                  to={`/coleccion/${collection.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text fontSize="lg" fontWeight="bold" color="white" mr={2}>
                    {collection.date}
                  </Text>
                  <Flex
                    align="center"
                    flex="1"
                    pr="2rem"
                    position="relative"
                    _hover={{
                      "> .arrow-icon": {
                        opacity: 1,
                        transform: "translateX(8px)",
                      },
                    }}
                  >
                    <Text fontSize="lg" color="white" mr={2}>
                      {collection.name}
                    </Text>
                    <Icon
                      as={FaArrowRight}
                      color="white"
                      opacity={0}
                      transition="opacity 0.3s ease, transform 0.3s ease"
                      className="arrow-icon"
                      position="absolute"
                      right="20px"
                    />
                  </Flex>
                </Link>
              </Flex>
            ))}
          </Flex>

          {/* Imagen dinámica al pasar el ratón sobre una colección */}
          {hoveredCollection && (
            <Box
              maxW={{ base: "0%", lg: "30%" }}
              transition="max-width 0.3s ease-in-out"
              display="block"
              boxShadow="lg"
            >
              <Image
                src={
                  collections.find((col) => col.slug === hoveredCollection)?.obras[0]
                    ?.imagen || "/path/to/placeholder-image.jpg"
                }
                alt="Vista previa de la colección"
                borderRadius="md"
                draggable={false}
              />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Galería separada por colección */}
      <Box pl={{ base: "1rem", lg: "3rem" }} py="3rem">
        {coleccionesFiltradas.map((collection) => {
          let obras = collection.obras;
          // Si es "centinelas", barajamos las obras
          if (collection.slug === "centinelas") {
            obras = shuffleArray(obras);
          }

          return (
            <Box key={collection.name} mb="3rem">
              <Heading as="h2" size="lg" mb="1rem">
                {collection.name}
              </Heading>
              <Text pr="1rem" mb="1rem">
                {collection.description}
              </Text>

              {/* Slider horizontal */}
              <HorizontalSlider>
                {obras.map((obra, index) => (
                  <Box
                    key={`${obra.titulo}-${index}`}
                    display="inline-block"
                    flexShrink={0}
                    width={{ base: "80%", sm: "60%", md: "40%", lg: "22%" }}
                    mr="1rem"
                  >
                    <ObraCard
                      obra={{
                        ...obra,
                        collection: collection.name,
                        imagen: obra.imagen || "/path/to/placeholder-image.jpg",
                      }}
                    />
                  </Box>
                ))}
              </HorizontalSlider>

              {/* Botón para ver la colección */}
              <Flex justify="flex-start" mt={4}>
                <Link as={RouterLink} to={`/coleccion/${collection.slug}`}>
                  <Button colorScheme="teal" variant="solid">
                    Ver Colección
                  </Button>
                </Link>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MiObra;