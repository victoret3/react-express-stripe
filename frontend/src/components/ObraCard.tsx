import React from "react";
import {
  Box,
  Image,
  Text,
  AspectRatio,
  useColorModeValue,
} from "@chakra-ui/react";

interface Obra {
  imagen?: string;
  video?: string;
  titulo: string;
  fecha: string;
  collection: string;
  category?: "video" | "mapa" | "fotografia" | "escudo" | "exposicion";
}

function extraerYouTubeID(url: string): string {
  const match = url.match(/(\?v=|\.be\/)([^#&?]+)/);
  return match ? match[2] : url;
}

const ObraCard: React.FC<{ obra: Obra }> = ({ obra }) => {
  const gradientColor = useColorModeValue(
    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
  );

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="md"
      boxShadow="lg"
      bg="white"
      transition="transform 0.3s ease"
      _hover={{ transform: "scale(1.05)" }}
    >
      {obra.video ? (
        // Si hay VIDEO -> incrustamos un iframe de YouTube
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={`https://www.youtube.com/embed/${extraerYouTubeID(obra.video)}`}
            title={obra.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </AspectRatio>
      ) : (
        // Si NO hay video, mostramos la IMAGEN
        <Image
          src={obra.imagen}
          alt={obra.titulo}
          w="100%"
          h="15rem"
          objectFit="cover"
        />
      )}

      {/* Overlay en la parte inferior con degradado */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        w="100%"
        pt={6}
        pb={2}
        px={3}
        bgGradient={gradientColor}
      >
        <Text fontWeight="bold" color="white" isTruncated fontSize="md">
          {obra.titulo}
        </Text>
        <Text color="gray.200" fontSize="sm">
          {obra.fecha}
        </Text>
      </Box>
    </Box>
  );
};

export default ObraCard;
