import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Image,
  AspectRatio,
  Button,
  Container,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { collections } from "../config/CollectionConfig";

// -----------------------------------------------------
// Tipos de datos básicos (ajusta si tu proyecto difiere)
// -----------------------------------------------------
interface Obra {
  imagen?: string;
  video?: string;
  category?: "video" | "mapa" | "fotografia" | "escudo" | "exposicion";
  titulo: string;
  fecha: string;
}

interface Collection {
  name: string;
  slug: string;
  date: string;
  description: string;
  descriptionLong?: string | string[];
  obras: Obra[];
}

// -----------------------------------------------------
// Extraer ID de YouTube de una URL
// (busca ?v= o .be/ )
// -----------------------------------------------------
function extraerID(url: string): string {
  const match = url.match(/(\?v=|\.be\/)([^#&?]+)/);
  return match ? match[2] : url;
}

// -----------------------------------------------------
// Componente principal que selecciona el layout
// -----------------------------------------------------
const CollectionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [modalImage, setModalImage] = useState<string | null>(null);
  const openModal = (url: string) => setModalImage(url);
  const closeModal = () => setModalImage(null);

  const collection = collections.find((col) => col.slug === slug);

  if (!collection) {
    return (
      <Container maxW="lg" py={10}>
        <Heading>404 - Colección no encontrada</Heading>
        <Text>La colección que buscas no existe.</Text>
      </Container>
    );
  }

  const LayoutComponent =
    collection.slug === "centinelas" || collection.slug === "alhambra-shirvanshah"
      ? CentinelasLayout
      : DefaultLayout;

  return (
    <>
      <LayoutComponent collection={collection} openModal={openModal} />

      {/* Modal de imagen ampliada */}
      <Modal isOpen={!!modalImage} onClose={closeModal} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          maxW="90vw"
          maxH="90vh"
          position="relative"
        >
          <IconButton
            icon={<CloseIcon />}
            aria-label="Cerrar"
            position="absolute"
            top={2}
            right={2}
            bg="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.900" }}
            onClick={closeModal}
          />
          {modalImage && (
            <Image
              src={modalImage}
              alt="Imagen ampliada"
              objectFit="contain"
              maxH="80vh"
              width="100%"
              borderRadius="md"
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default CollectionPage;

// -----------------------------------------------------
// LAYOUT GENÉRICO para el resto de colecciones
// -----------------------------------------------------
function DefaultLayout({
  collection,
  openModal,
}: {
  collection: Collection;
  openModal: (url: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <Box position="relative">
      {/* Franja gris oscuro SOLO en móvil */}
      <Box
        display={{ base: "block", md: "none" }}
        height="4rem"
        bg="gray.300"
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={0}
      />

      <Container
        maxW="7xl"
        py={10}
        mt={{ base: "0rem", md: 0 }} // Empuja el contenido 4rem hacia abajo en mobile
        position="relative"
        zIndex={1}
      >
        {/* Botón de Volver */}
        <Button onClick={() => navigate(-1)} colorScheme="teal" mb={6} mt="4rem">
          Volver
        </Button>

        {/* Nombre + Fecha */}
        <Heading fontSize="3xl" mb={2}>
          {collection.name}
        </Heading>
        <Text fontSize="md" mb={4} color="gray.600">
          {collection.date}
        </Text>

        {/* Descripción larga (puede ser un string o array de string) */}
        {Array.isArray(collection.descriptionLong) ? (
          collection.descriptionLong.map((paragraph, i) => (
            <Text key={i} mt={i > 0 ? 4 : 0} fontSize="md" color="gray.700">
              {paragraph}
            </Text>
          ))
        ) : (
          <Text fontSize="md" color="gray.700">
            {collection.descriptionLong}
          </Text>
        )}

        {/* Galería sin filtrar categorías (pinta todo tal cual) */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mt={8}>
          {collection.obras.map((obra, index) => (
            <CardItem
              key={index}
              obra={obra}
              onClick={obra.imagen ? () => openModal(obra.imagen!) : undefined}
            />
          ))}
        </SimpleGrid>

        {/* Otras colecciones al final */}
        <OtherCollections currentSlug={collection.slug} />
      </Container>
    </Box>
  );
}

// -----------------------------------------------------
// LAYOUT para "centinelas" y "alhambra-shirvanshah"
// (separando las obras por categoría, incluyendo videos)
// -----------------------------------------------------
function CentinelasLayout({
  collection,
  openModal,
}: {
  collection: Collection;
  openModal: (url: string) => void;
}) {
  const navigate = useNavigate();

  // Agrupar por categoría
  const obrasVideo = collection.obras.filter((o) => o.category === "video");
  const obrasMapas = collection.obras.filter((o) => o.category === "mapa");
  const obrasFotos = collection.obras.filter((o) => o.category === "fotografia");
  const obrasEscudos = collection.obras.filter((o) => o.category === "escudo");
  const obrasExpos = collection.obras.filter((o) => o.category === "exposicion");

  return (
    <Box position="relative">
      {/* Franja gris oscuro SOLO en móvil */}
      <Box
        display={{ base: "block", md: "none" }}
        height="4rem"
        bg="gray.300"
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={0}
      />

      <Container
        maxW="7xl"
        py={10}
        mt={{ base: "0rem", md: 0 }} // Empuja el contenido 4rem hacia abajo en mobile
        position="relative"
        zIndex={1}
      >
        {/* Botón de Volver */}
        <Button onClick={() => navigate(-1)} colorScheme="teal" mb={6} mt="4rem">
          Volver
        </Button>

        {/* Nombre + Fecha */}
        <Heading fontSize="3xl" mb={2}>
          {collection.name}
        </Heading>
        <Text fontSize="md" mb={4} color="gray.600">
          {collection.date}
        </Text>

        {/* Descripción larga */}
        {Array.isArray(collection.descriptionLong) ? (
          collection.descriptionLong.map((paragraph, i) => (
            <Text key={i} mt={i > 0 ? 4 : 0} fontSize="md" color="gray.700">
              {paragraph}
            </Text>
          ))
        ) : (
          <Text fontSize="md" color="gray.700">
            {collection.descriptionLong}
          </Text>
        )}

        {/* Sección de VIDEOS */}
        {obrasVideo.length > 0 && (
          <Box mt={8}>
            <Heading fontSize="xl" mb={4} color="teal.600">
              Video
            </Heading>
            <Stack spacing={6}>
              {obrasVideo.map((obra, idx) => (
                <AspectRatio key={idx} ratio={16 / 9}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extraerID(obra.video!)}`}
                    title={obra.titulo}
                    allowFullScreen
                  />
                </AspectRatio>
              ))}
            </Stack>
          </Box>
        )}

        {/* Sección de MAPAS */}
        {obrasMapas.length > 0 && (
          <Box mt={8}>
            <Heading fontSize="xl" mb={4} color="teal.600">
              A. Mapas
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {obrasMapas.map((obra, i) => (
                <CardItem
                  key={i}
                  obra={obra}
                  onClick={obra.imagen ? () => openModal(obra.imagen!) : undefined}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Fotografías */}
        {obrasFotos.length > 0 && (
          <Box mt={8}>
            <Heading fontSize="xl" mb={4} color="teal.600">
              B. Fotografías
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {obrasFotos.map((obra, i) => (
                <CardItem
                  key={i}
                  obra={obra}
                  onClick={obra.imagen ? () => openModal(obra.imagen!) : undefined}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Escudos */}
        {obrasEscudos.length > 0 && (
          <Box mt={8}>
            <Heading fontSize="xl" mb={4} color="teal.600">
              C. Escudos
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {obrasEscudos.map((obra, i) => (
                <CardItem
                  key={i}
                  obra={obra}
                  onClick={obra.imagen ? () => openModal(obra.imagen!) : undefined}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Exposiciones */}
        {obrasExpos.length > 0 && (
          <Box mt={8}>
            <Heading fontSize="xl" mb={4} color="teal.600">
              D. Exposiciones
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {obrasExpos.map((obra, i) => (
                <CardItem
                  key={i}
                  obra={obra}
                  onClick={obra.imagen ? () => openModal(obra.imagen!) : undefined}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Otras colecciones al final */}
        <OtherCollections currentSlug={collection.slug} />
      </Container>
    </Box>
  );
}

// -----------------------------------------------------
// CardItem: tarjeta con imagen (si la obra NO es vídeo)
// -----------------------------------------------------
function CardItem({
  obra,
  onClick,
}: {
  obra: Obra;
  onClick?: () => void;
}) {
  return (
    <Box
      bg="white"
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: "scale(1.02)" }}
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
    >
      {obra.imagen && (
        <Image
          src={obra.imagen}
          alt={obra.titulo}
          width="100%"
          height="240px"
          objectFit="cover"
        />
      )}
      <Box p={4}>
        <Heading fontSize="md" noOfLines={1} mb={1}>
          {obra.titulo}
        </Heading>
        <Text fontSize="sm" color="gray.600">
          {obra.fecha}
        </Text>
      </Box>
    </Box>
  );
}

// -----------------------------------------------------
// Sección final: Otras colecciones para enlazar
// -----------------------------------------------------
function OtherCollections({ currentSlug }: { currentSlug: string }) {
  const otherCollections = collections.filter((c) => c.slug !== currentSlug);

  if (otherCollections.length === 0) return null;

  return (
    <Box mt={16}>
      <Heading fontSize="2xl" mb={4}>
        Otras Colecciones
      </Heading>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
        {otherCollections.map((col) => {
          const previewImage = col.obras[0]?.imagen;
          return (
            <Link key={col.slug} to={`/coleccion/${col.slug}`}>
              <Box
                bg="white"
                boxShadow="md"
                borderRadius="md"
                overflow="hidden"
                transition="transform 0.2s"
                _hover={{ transform: "scale(1.02)" }}
                textAlign="center"
              >
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt={col.name}
                    width="100%"
                    height="140px"
                    objectFit="cover"
                  />
                ) : (
                  <Box width="100%" height="140px" bg="gray.200" />
                )}
                <Box p={3}>
                  <Text fontWeight="bold" noOfLines={2}>
                    {col.name}
                  </Text>
                </Box>
              </Box>
            </Link>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}