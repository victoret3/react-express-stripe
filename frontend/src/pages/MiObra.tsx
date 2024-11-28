import React, { useRef, useState } from 'react';
import {
  Box,
  Heading,
  Select,
  Image,
  Text,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { obras } from '../config/ObraConfig';
import ObraCard from '../components/ObraCard';
import { FaQuoteLeft } from 'react-icons/fa';
import headerImage from '../assets/nani.jpg';

const MiObra: React.FC = () => {
    const [filtro, setFiltro] = useState<string>('');
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
  
    // Manejar el inicio del arrastre
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevenir el comportamiento predeterminado
      setIsDragging(true);
      setStartX(e.pageX); // Posición inicial del mouse
      if (sliderRef.current) {
        setScrollLeft(sliderRef.current.scrollLeft); // Posición inicial del scroll
      }
    };
  
    // Manejar el fin del arrastre
    const handleMouseUpOrLeave = () => {
      setIsDragging(false); // Desactivar estado de arrastre
    };
  
    // Manejar el movimiento del mouse
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !sliderRef.current) return; // Si no está arrastrando, salir
      e.preventDefault(); // Prevenir comportamiento predeterminado
      const dx = e.pageX - startX; // Diferencia de desplazamiento
      sliderRef.current.scrollLeft = scrollLeft - dx; // Actualizar posición del scroll
    };
  
    // Obtener los periodos únicos
    const periodos = Array.from(new Set(obras.map((obra) => obra.collection)));
  
    // Filtrar obras por periodo
    const obrasFiltradas = filtro
      ? obras.filter((obra) => obra.collection === filtro)
      : obras;

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

        {/* Header en la cabecera */}
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
          width={{ base: '100vw', lg: '55rem' }}
        >
          {/* Icono de quotes */}
          <Icon as={FaQuoteLeft} boxSize={{ base: '2rem', lg: '3rem' }} color="whiteAlpha.800" mb={2} />

          {/* Ajustes del texto */}
          <Heading
            as="h1"
            size="md"
            lineHeight="1.5rem"
            fontSize={{ base: '1rem', lg: '1.25rem' }}
            fontWeight="normal"
            letterSpacing="0.1rem"
            px="1rem"
            pb={{ base: '4rem', lg: '5rem' }}
          >
            Me complace sentirme como un perpetuo extranjero. Un escultor en el cuerpo de un pintor y un pintor cuando esculpo; pero, ante todo, soy un aprendiz en rebeldía…
          </Heading>
        </Flex>
      </Box>

      <Box>
      {/* Filtro por periodo */}
      <Box px="3rem" my="2rem" maxW="40vw">
        <Select
          placeholder="Filtrar por colección"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          {periodos.map((collection) => (
            <option key={collection} value={collection}>
              {collection}
            </option>
          ))}
        </Select>
      </Box>

      {/* Galería separada por periodos */}
      {periodos.map((periodo) => {
        const obrasPeriodo = obrasFiltradas.filter(
          (obra) => obra.collection === periodo
        );

        if (obrasPeriodo.length === 0) return null;

        return (
          <Box key={periodo} pl="3rem" my="3rem">
            <Heading as="h2" size="md" mb="2rem">
              {periodo}
            </Heading>
            <Flex
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onMouseMove={handleMouseMove}
              overflowX="scroll"
              css={{
                '&::-webkit-scrollbar': { display: 'none' }, // Ocultar scrollbar
                '-ms-overflow-style': 'none', // IE y Edge
                'scrollbar-width': 'none', // Firefox
              }}
              gap="1rem"
              pl="0rem"
              cursor={isDragging ? 'grabbing' : 'grab'} // Cambiar cursor según estado
            >
              {obrasPeriodo.map((obra) => (
                <Box
                  key={obra.titulo}
                  flex="0 0 auto"
                  width={{ base: '80%', sm: '60%', md: '40%', lg: '22%' }}
                >
                  <ObraCard obra={obra} />
                </Box>
              ))}
              <Box flex="0 0 auto" width="1rem" />
            </Flex>
          </Box>
        );
      })}
    </Box>

    </Box>
  );
};

export default MiObra;
