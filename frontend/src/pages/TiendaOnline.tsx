import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Image, Text, IconButton, Spinner, Badge, Heading, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useCart } from '../CartContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  stock: number; // <-- Importante
}

const TiendaOnline: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onOpen();
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
        console.log('Productos devueltos:', response.data);
        setProducts(response.data);
      } catch (error) {
        console.error('Error al obtener productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box position="relative">
      {/* Franja lateral o superior */}
      <Box
        position="fixed"
        top={{ base: '0rem', md: '0' }}
        left={{ base: '0', lg: '0' }}
        h={{ base: '5rem', lg: '100%' }}
        w={{ base: '100%', lg: '7rem' }}
        bg="brand.accent1"
        display="flex"
        justifyContent="center"
        maxH="100vh"
        alignItems="center"
        zIndex={2}
      >
        <Heading
          fontSize={{ base: '1.5rem', lg: '2rem' }}
          color="brand.primary"
          textAlign="center"
          zIndex={2}
          sx={{
            writingMode: { base: 'horizontal-tb', lg: 'vertical-rl' },
            transform: { base: 'none', lg: 'rotate(180deg)' },
          }}
        >
          Shop
        </Heading>
      </Box>

      {/* Grid de productos */}
      <Box p={5} ml={{ lg: '7rem' }}>
        <SimpleGrid
          columns={{ base: 1, sm: 3, md: 3, lg: 4 }}
          spacing={4}
          mt={{ base: '6rem', sm: '5rem', md: '5rem' }}
        >
          {products.map((product) => (
            <Box
              key={product._id}
              position="relative"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="lg"
              _hover={{
                '.description': { opacity: 1 },
              }}
            >
              {/* Imagen principal */}
              <Image
                src={product.image}
                alt={product.name}
                objectFit="cover"
                w="100%"
                h="300px"
                transition="transform 0.3s ease"
                _hover={{ transform: 'scale(1.05)' }}
                onClick={() => handleImageClick(product.image)}
              />

              {/* Si stock es 0, mostramos overlay con AGOTADO */}
              {product.stock === 0 && (
  <Box
    position="absolute"
    top="0"
    right="0"
    borderRadius="0 0 0 8px"
    bg="rgba(255, 0, 0, 0.5)"
    color="white"
    p={2}
    fontSize="sm"
    fontWeight="bold"
    zIndex={2}
  >
    AGOTADO
  </Box>
)}

              {/* Título del producto */}
              <Text
                position="absolute"
                bottom="10px"
                left="10px"
                color="white"
                fontWeight="bold"
                fontSize="lg"
                bg="rgba(0, 0, 0, 0.6)"
                px={2}
                borderRadius="md"
              >
                {product.name}
              </Text>

              {/* Precio */}
              <Badge
                position="absolute"
                top="10px"
                left="10px"
                colorScheme="teal"
                fontSize="lg"
                borderRadius="md"
                px={2}
              >
                {product.price.toFixed(0)} €
              </Badge>

              {/* Botón para agregar al carrito (deshabilitado si stock = 0) */}
              <IconButton
                icon={<AddIcon />}
                aria-label="Añadir al carrito"
                position="absolute"
                top="10px"
                right="10px"
                colorScheme="blue"
                borderRadius="full"
                onClick={() =>
                  addToCart({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    image: product.image,
                    stock: product.stock,
                  })
                }
                isDisabled={product.stock === 0}
              />

              {/* Descripción que aparece al hacer hover */}
              <Box
                className="description"
                position="absolute"
                bottom="0"
                left="0"
                right="0"
                bg="rgba(0, 0, 0, 0.8)"
                color="white"
                p={4}
                opacity={0}
                transition="opacity 0.3s ease"
                textAlign="center"
                fontSize="sm"
              >
                {product.description}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxW="80vw">
          <ModalHeader></ModalHeader>
          <ModalCloseButton />
          <ModalBody>
  {selectedImage && (
    <Image
      src={selectedImage}
      alt="Ampliado"
      w="100%"
      maxH="80vh"
      objectFit="contain"
    />
  )}
</ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TiendaOnline;