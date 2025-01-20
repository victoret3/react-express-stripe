import React from "react";
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
} from "@chakra-ui/react";
import { collections } from "../config/CollectionConfig";

// Interfaces mínimas (ajusta según tu proyecto)
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

/* Helper para extraer ID de youtube y usarlo en embed */
function extraerID(url: string): string {
  const match = url.match(/(\?v=|\.be\/)([^#&?]+)/);
  return match ? match[2] : url;
}

const CollectionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = collections.find((col) => col.slug === slug);

  if (!collection) {
    return (
      <Container maxW="lg" py={10}>
        <Heading>404 - Colección no encontrada</Heading>
        <Text>La colección que buscas no existe.</Text>
      </Container>
    );
  }

  // Solo para "centinelas", usamos un layout con secciones (Video, Mapas, etc.)
  if (collection.slug === "centinelas") {
    return <CentinelasLayout collection={collection} />;
  }

  // El resto de colecciones usa el layout genérico:
  return <DefaultLayout collection={collection} />;
};

export default CollectionPage;

/* -------------------------------------------------------------------------- */
/* ---------------------- LAYOUT GENÉRICO (NO CENTINELAS) -------------------- */
/* -------------------------------------------------------------------------- */
function DefaultLayout({ collection }: { collection: Collection }) {
  const navigate = useNavigate();

  return (
    <Container maxW="7xl" py={10}>
      {/* BOTÓN DE VOLVER */}
      <Button onClick={() => navigate(-1)} colorScheme="teal" mb={6}>
        Volver
      </Button>

      {/* TÍTULO + FECHA */}
      <Heading fontSize="3xl" mb={2}>
        {collection.name}
      </Heading>
      <Text fontSize="md" mb={4} color="gray.600">
        {collection.date}
      </Text>

      {/* DESCRIPCIÓN LARGA */}
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

      {/* GALERÍA (SIN FILTRO DE CATEGORY) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mt={8}>
        {collection.obras.map((obra, index) => (
          <CardItem key={index} obra={obra} />
        ))}
      </SimpleGrid>

      {/* OTRAS COLECCIONES */}
      <OtherCollections currentSlug={collection.slug} />
    </Container>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------- LAYOUT ESPECÍFICO PARA CENTINELAS (CON SECCIONES) ---------- */
/* -------------------------------------------------------------------------- */
function CentinelasLayout({ collection }: { collection: Collection }) {
  const navigate = useNavigate();

  // Filtrar categorías
  const obrasVideo = collection.obras.filter((o) => o.category === "video");
  const obrasMapas = collection.obras.filter((o) => o.category === "mapa");
  const obrasFotos = collection.obras.filter((o) => o.category === "fotografia");
  const obrasEscudos = collection.obras.filter((o) => o.category === "escudo");
  const obrasExpos = collection.obras.filter((o) => o.category === "exposicion");

  return (
    <Container maxW="7xl" py={10}>
      {/* BOTÓN DE VOLVER */}
      <Button onClick={() => navigate(-1)} colorScheme="teal" mb={6}>
        Volver
      </Button>

      {/* TÍTULO + FECHA */}
      <Heading fontSize="3xl" mb={2}>
        {collection.name}
      </Heading>
      <Text fontSize="md" mb={4} color="gray.600">
        {collection.date}
      </Text>

      {/* DESCRIPCIÓN LARGA */}
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

      {/* SECCIONES SEGÚN CATEGORÍA */}
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

      {obrasMapas.length > 0 && (
        <Box mt={8}>
          <Heading fontSize="xl" mb={4} color="teal.600">
            A. Mapas
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {obrasMapas.map((obra, i) => (
              <CardItem key={i} obra={obra} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {obrasFotos.length > 0 && (
        <Box mt={8}>
          <Heading fontSize="xl" mb={4} color="teal.600">
            B. Fotografías
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {obrasFotos.map((obra, i) => (
              <CardItem key={i} obra={obra} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {obrasEscudos.length > 0 && (
        <Box mt={8}>
          <Heading fontSize="xl" mb={4} color="teal.600">
            C. Escudos
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {obrasEscudos.map((obra, i) => (
              <CardItem key={i} obra={obra} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {obrasExpos.length > 0 && (
        <Box mt={8}>
          <Heading fontSize="xl" mb={4} color="teal.600">
            D. Exposiciones
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {obrasExpos.map((obra, i) => (
              <CardItem key={i} obra={obra} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* OTRAS COLECCIONES ABAJO */}
      <OtherCollections currentSlug={collection.slug} />
    </Container>
  );
}

/* -------------------------------------------------------------------------- */
/* ------ Un componente "CardItem" para IMAGEN o VÍDEO en forma de tarjeta -- */
/* -------------------------------------------------------------------------- */
function CardItem({ obra }: { obra: Obra }) {
  return (
    <Box
      bg="white"
      boxShadow="md"
      borderRadius="md"
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: "scale(1.02)" }}
    >
      {/* Si tiene video se lo mostrarías de otra forma, 
          pero en este ejemplo lo ignoramos para no liar: 
          ya lo estamos filtrando en "CentinelasLayout" */}
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

/* -------------------------------------------------------------------------- */
/* ------ Grid de "Otras Colecciones" para enlazar al final de la página ---- */
/* -------------------------------------------------------------------------- */
function OtherCollections({ currentSlug }: { currentSlug: string }) {
  const otherCollections = collections.filter(
    (c) => c.slug !== currentSlug
  );

  if (otherCollections.length === 0) return null;

  return (
    <Box mt={16}>
      <Heading fontSize="2xl" mb={4}>
        Otras Colecciones
      </Heading>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
        {otherCollections.map((col) => {
          const previewImage = col.obras[0]?.imagen; // primera imagen
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
