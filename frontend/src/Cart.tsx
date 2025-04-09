import React from 'react';
import { Box, Text, Button, Flex, Grid, Image, IconButton, useToast, Heading } from '@chakra-ui/react';
import { useCart } from './CartContext';
import CartSummary from './components/CartSummary';
import { FiTrash2, FiX } from 'react-icons/fi';

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const toast = useToast();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeFromCart(itemId);
    toast({
      title: 'Producto eliminado',
      description: `${itemName} se ha quitado del carrito`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="7xl" mx="auto" p={{ base: 4, md: 8 }}>
      <Heading as="h1" fontSize="3xl" mb={8} color="gray.800">
        Tu Carrito ({cart.length})
      </Heading>

      {cart.length === 0 ? (
        <Flex flexDir="column" align="center" textAlign="center" py={20}>
          <Box fontSize="6xl" mb={4} color="gray.300">
            🛒
          </Box>
          <Text fontSize="xl" color="gray.500" mb={4}>
            Tu carrito está vacío
          </Text>
          <Button colorScheme="blue" as="a" href="/products">
            Explorar Productos
          </Button>
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Lista de productos */}
          <Box>
            {cart.map((item) => (
              <Flex
                key={item._id}
                borderBottom="1px solid"
                borderColor="gray.100"
                py={6}
                _last={{ borderBottom: 'none' }}
                transition="all 0.2s"
                _hover={{ bg: 'gray.50' }}
              >
                <Box flexShrink={0} w="120px" h="120px" bg="gray.100" borderRadius="lg" overflow="hidden">
                  <Image
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    objectFit="cover"
                    w="full"
                    h="full"
                  />
                </Box>

                <Box flex={1} ml={6}>
                  <Flex justify="space-between" align="flex-start">
                    <Box>
                      <Heading as="h3" fontSize="lg" mb={2} color="gray.800">
                        {item.name}
                      </Heading>
                      <Text color="gray.600" mb={2}>
                        {item.description?.substring(0, 80)}...
                      </Text>
                    </Box>
                    <IconButton
                      aria-label="Eliminar producto"
                      icon={<FiTrash2 />}
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemoveItem(item._id, item.name)}
                    />
                  </Flex>

                  <Flex align="center" justify="space-between" mt={4}>
                    <Text fontWeight="bold" color="blue.600" fontSize="xl">
                      €{item.price.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            ))}
          </Box>

          {/* Resumen del pedido */}
          <Box
            position={{ lg: 'sticky' }}
            top={{ lg: '24' }}
            h="fit-content"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={6}
            bg="white"
            boxShadow="md"
          >
            <Heading as="h2" fontSize="2xl" mb={6} color="gray.800">
              Resumen del Pedido
            </Heading>

            <Flex justify="space-between" mb={4}>
              <Text color="gray.600">Subtotal:</Text>
              <Text fontWeight="semibold">€{totalAmount.toFixed(2)}</Text>
            </Flex>

            <Flex justify="space-between" mb={6}>
              <Text color="gray.600">Envío:</Text>
              <Text fontWeight="semibold" color="green.500">
                Gratis
              </Text>
            </Flex>

            <Box borderY="1px solid" borderColor="gray.100" py={4} mb={6}>
              <Flex justify="space-between">
                <Text fontWeight="bold">Total:</Text>
                <Heading as="span" fontSize="xl" color="blue.600">
                  €{totalAmount.toFixed(2)}
                </Heading>
              </Flex>
            </Box>

            <CartSummary />

            <Button
              onClick={clearCart}
              variant="outline"
              colorScheme="red"
              w="full"
              mt={4}
              leftIcon={<FiX />}
            >
              Vaciar Carrito
            </Button>
          </Box>
        </Grid>
      )}
    </Box>
  );
};

export default Cart;