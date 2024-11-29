import React, { useRef, useState } from 'react';
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
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Manejar el inicio del arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX);
    if (sliderRef.current) {
      setScrollLeft(sliderRef.current.scrollLeft);
    }
  };

  // Manejar el fin del arrastre
  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Manejar el movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startX;
    sliderRef.current.scrollLeft = scrollLeft - dx;
  };

  // Obtener los nombres únicos de las colecciones
  const colecciones = collections.map((collection) => collection.name);

  // Filtrar las colecciones según el filtro seleccionado
  const coleccionesFiltradas = filtro
    ? collections.filter((collection) => collection.name === filtro)
    : collections;

  return (
    <Box>
      {/* Cabecera con imagen de fondo */}
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
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={1}
        />

        <Box
          position="absolute"
          top={{ base: 0, lg: '0' }}
          left={{ base: '0', lg: '0' }}
          h={{ base: '5rem', lg: '100%' }}
          w={{ base: '100%', lg: '7rem' }}
          bg="rgba(0, 0, 0, 0.9)"
          zIndex={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Text
            fontSize={{ base: '1.5rem', lg: '2rem' }}
            color="white"
            textAlign="center"
            sx={{
              writingMode: { base: 'horizontal-tb', lg: 'vertical-rl' },
              transform: { base: 'none', lg: 'rotate(180deg)' },
            }}
          >
            Mi Obra
          </Text>
        </Box>

        {/* Índice de colecciones */}
        <Flex
          position="absolute"
          bottom="5%"
          width="50vw"
          left="43%"
          zIndex={3}
          flexDirection="column"
          alignItems="center"
          bg="rgba(0, 0, 0, 0.7)"
          borderRadius="md"
          p="2rem"
        >
{collections.map((collection) => (
  <Flex
    key={collection.slug}
    align="center"
    justify="space-between"
    w="100%"
    p={2}
    _hover={{ bg: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
  >
    <Link
      as={RouterLink}
      to={`/colecciones/${collection.slug}`}
      style={{ display: 'flex', alignItems: 'center', width: '100%' }}
    >
      {/* Fecha */}
      <Text fontSize="lg" fontWeight="bold" color="white" mr={2}>
        {collection.date}
      </Text>

      {/* Contenedor del nombre y la flecha */}
      <Flex
        align="center"
        flex="1"
        position="relative"
        _hover={{
          '> .arrow-icon': { opacity: 1, transform: 'translateX(8px)' }, // Aparece al hacer hover
        }}
      >
        {/* Nombre de la colección */}
        <Text fontSize="lg" color="white" mr={2}>
          {collection.name}
        </Text>

        {/* Flecha */}
        <Icon
          as={FaArrowRight}
          color="white"
          opacity={0} // Oculta inicialmente
          transition="opacity 0.3s ease, transform 0.3s ease"
          className="arrow-icon"
          position="absolute"
          right="20px" // Ajusta según tu diseño
        />
      </Flex>
    </Link>
  </Flex>
))}

</Flex>
      </Box>

      <Box>
        {/* Filtro por colección */}
        <Box px="3rem" my="2rem" maxW="40vw">
          <Select
            placeholder="Filtrar por colección"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            {colecciones.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </Select>
        </Box>

        {/* Galería separada por colección */}
        {coleccionesFiltradas.map((collection) => (
          <Box key={collection.name} pl="3rem" my="3rem">
            <Heading as="h2" size="md" mb="2rem">
              {collection.name}
            </Heading>
            <Text mb="2rem">{collection.description}</Text>
            <Flex
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onMouseMove={handleMouseMove}
              overflowX="scroll"
              css={{
                '&::-webkit-scrollbar': { display: 'none' },
                '-ms-overflow-style': 'none',
                'scrollbar-width': 'none',
              }}
              gap="1rem"
              pl="0rem"
              cursor={isDragging ? 'grabbing' : 'grab'}
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
