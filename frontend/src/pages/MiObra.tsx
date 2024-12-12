import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Select,
  Image,
  Text,
  Flex,
  Icon,
  Link,
} from '@chakra-ui/react';
import { collections } from '../config/CollectionConfig';
import ObraCard from '../components/ObraCard';
import { FaArrowRight } from 'react-icons/fa';
import headerImage from '../assets/nani.jpg';
import { Link as RouterLink } from 'react-router-dom';

const MiObra: React.FC = () => {
  const [filtro, setFiltro] = useState<string>('');
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = 0;
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const colecciones = collections.map((collection) => collection.name);

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

        {/* Franja lateral */}
        <Box
          position="absolute"
          top={{ base: 0, lg: '0' }}
          left="0"
          h="100%"
          w={{ base: '5rem', lg: '7rem' }}
          bg="brand.primary"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={2}
        >
          <Heading
            fontSize={{ base: '1.5rem', lg: '2rem' }}
            color="brand.accent2"
            textAlign="center"
            sx={{
              writingMode: { base: 'horizontal-tb', lg: 'vertical-rl' },
              transform: { base: 'none', lg: 'rotate(180deg)' },
            }}
          >
            Mi Obra
          </Heading>
        </Box>

        {/* Contenedor principal centrado */}
        <Flex
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={3}
          w="90%"
          maxW="1150px"
          direction={{ base: 'column', lg: 'row' }}
          justify="space-between"
          align="center"
          gap={{ base: '1rem', lg: '2rem' }}
        >
          {/* Tabla de colecciones */}
          <Flex
            direction="column"
            bg="rgba(0, 0, 0, 0.8)"
            borderRadius="md"
            p={{ base: '1rem', lg: '2rem' }}
            gap="0rem"
            maxW={{ base: '100%', lg: '65%' }}
          >
            {collections.map((collection) => (
              <Flex
                key={collection.slug}
                align="center"
                justify="space-between"
                w="100%"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredCollection(collection.slug)}
                onMouseLeave={() => setHoveredCollection(null)}
              >
                <Link
                  as={RouterLink}
                  to={`/coleccion/${collection.slug}`}
                  style={{ display: 'flex', alignItems: 'center', width: '100%' }}
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
                      '> .arrow-icon': { opacity: 1, transform: 'translateX(8px)' },
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

          {/* Imagen dinámica */}
          {hoveredCollection && (
            <Box
              maxW={{ base: '90%', lg: '35%' }}
              transition="max-width 0.3s ease-in-out"
              display="block"
              boxShadow="lg"
            >
              <Image
                src={
                  collections.find((col) => col.slug === hoveredCollection)?.obras[0]
                    ?.imagen || '/path/to/placeholder-image.jpg'
                }
                alt="Vista previa de la colección"
                borderRadius="md"
              />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Galería separada por colección */}
      <Box px={{ base: '1rem', lg: '3rem' }} py="3rem">
        {coleccionesFiltradas.map((collection) => (
          <Box key={collection.name} mb="3rem">
            <Heading as="h2" size="lg" mb="1rem">
              {collection.name}
            </Heading>
            <Text mb="1rem">{collection.description}</Text>
            <Flex
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              overflowX="scroll"
              cursor={isDragging ? 'grabbing' : 'grab'}
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none',
              }}
              gap="1rem"
              px="1rem"
            >
              {collection.obras.map((obra) => (
                <Box
                  key={obra.titulo}
                  flex="0 0 auto"
                  width={{ base: '80%', sm: '60%', md: '40%', lg: '22%' }}
                >
                  <ObraCard
                    obra={{
                      ...obra,
                      collection: collection.name,
                      imagen: obra.imagen || '/path/to/placeholder-image.jpg',
                    }}
                  />
                </Box>
              ))}
              <Box flex="0 0 auto" width="1rem" />
            </Flex>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MiObra;
