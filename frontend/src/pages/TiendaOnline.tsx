import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Image, Text, Button, Spinner } from '@chakra-ui/react';
import axios from 'axios';
import { useCart } from '../CartContext'; // Importar el hook del carrito

// Define la interfaz del producto
interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

const TiendaOnline: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addToCart } = useCart(); // Usar la función para añadir al carrito

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:8888/products'); // Llama al endpoint del backend
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener productos:', error);
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
    <Box p={5}>
      <Text fontSize="2xl" mb={4}>
        Tienda Online
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
        {products.map((product) => (
          <Box key={product._id} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
            <Image src={product.image} alt={product.name} />
            <Text mt={2} fontWeight="bold">
              {product.name}
            </Text>
            <Text>Precio: €{product.price.toFixed(2)}</Text>
            <Button
              colorScheme="blue"
              mt={2}
              onClick={() =>
                addToCart({
                  id: product._id,
                  name: product.name,
                  price: product.price,
                  description: product.description,
                  image: product.image,
                })
              }
            >
              Añadir al carrito
            </Button>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default TiendaOnline;
