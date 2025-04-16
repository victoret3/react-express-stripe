import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Text,
  Button,
  Image,
  Flex,
  Heading,
  useToast,
  Divider,
  HStack,
  Spinner,
  useBreakpointValue
} from '@chakra-ui/react';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Product } from '../types/Product';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

interface CartSummaryProps {
  filter?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ filter }) => {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Estilo responsivo para el icono
  const iconColor = useBreakpointValue({ base: "white", md: "black" });
  const iconStyle = useBreakpointValue({
    base: {
      // Para móvil: icono blanco sin sombra
    },
    md: {
      // Para escritorio: icono negro con borde blanco
      backgroundColor: 'white',
      padding: '8px',
      borderRadius: '4px',
      outline: '1px solid black',
      boxShadow: '0 0 0 1px black'
    }
  });

  const totalAmount = cart.reduce((sum, item: Product) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Añade productos antes de pagar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);

    try {
      const lineItems = cart.map((item) => ({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round((item.price || 0) * 100),
          product_data: {
            name: item.name || 'Producto sin nombre',
            description: item.description || '',
            images: item.image ? [item.image] : [],
            metadata: { productId: item._id },
          },
        },
        quantity: 1,
      }));

      const response = await fetch('https://nani-boronat-api.vercel.app/api/payment/session-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems,
          successUrl: 'https://naniboron.web.app/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: 'https://naniboron.web.app/tienda-online',
        }),
      });

      const session = await response.json();
      if (!response.ok) throw new Error(session.error || 'Error en el servidor');

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Error inicializando Stripe');

      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) throw error;

      clearCart();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error en el pago',
        description: error instanceof Error ? error.message : 'Inténtalo de nuevo',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Box position="relative">
        <Box display="inline-block" style={iconStyle}>
          <IconButton
            icon={<FiShoppingCart />}
            aria-label="Ver carrito"
            onClick={() => setDrawerOpen(true)}
            variant="ghost"
            size="md"
            fontSize="xl"
            color={iconColor}
            bg="transparent"
            _hover={{ 
              bg: 'whiteAlpha.200'
            }}
            _active={{ bg: 'none' }}
            _focus={{ boxShadow: 'none' }}
          />
        </Box>
        {cart.length > 0 && (
          <Badge
            position="absolute"
            top="0"
            right="0"
            colorScheme="red"
            borderRadius="full"
            px={2}
            transform="translate(25%, -25%)"
          >
            {cart.length}
          </Badge>
        )}
      </Box>

      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        size={{ base: 'full', md: 'md' }}
      >
        <DrawerOverlay />
        <DrawerContent bg="gray.50">
          <DrawerCloseButton size="lg" m={2} />
          <DrawerBody p={{ base: 4, md: 6 }}>
            <Heading as="h2" fontSize="2xl" mb={6}>
              Tu Carrito ({cart.length})
            </Heading>

            {cart.length === 0 ? (
              <Flex
                flexDir="column"
                align="center"
                justify="center"
                h="70vh"
                textAlign="center"
                color="gray.500"
              >
                <Box fontSize="6xl" mb={4}>
                  🛒
                </Box>
                <Text fontSize="xl">Tu carrito está vacío</Text>
              </Flex>
            ) : (
              <VStack spacing={6} align="stretch">
                {cart.map((item) => (
                  <Flex
                    key={item._id}
                    gap={4}
                    p={4}
                    bg="white"
                    borderRadius="lg"
                    boxShadow="sm"
                    _hover={{ boxShadow: 'md' }}
                    transition="all 0.2s"
                  >
                    <Image
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.name}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="md"
                      fallbackSrc="/placeholder-product.jpg"
                    />
                    <Box flex={1}>
                      <Text fontWeight="600" noOfLines={1} mb={1}>
                        {item.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {item.description}
                      </Text>
                      <Text fontWeight="bold" color="blue.600" mt={2}>
                        €{(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}
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
                ))}

                <Box mt={8}>
                  <VStack spacing={4} bg="white" p={6} borderRadius="xl" boxShadow="sm">
                    <Flex w="full" justify="space-between">
                      <Text color="gray.600">Subtotal:</Text>
                      <Text fontWeight="600">€{totalAmount.toFixed(2)}</Text>
                    </Flex>
                    <Flex w="full" justify="space-between">
                      <Text color="gray.600">Envío:</Text>
                      <Text fontWeight="600" color="green.500">
                        Gratis
                      </Text>
                    </Flex>
                    <Divider />
                    <Flex w="full" justify="space-between" fontSize="lg">
                      <Text fontWeight="700">Total:</Text>
                      <Text fontWeight="700" color="blue.600">
                        €{totalAmount.toFixed(2)}
                      </Text>
                    </Flex>

                    <Button
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      onClick={handleCheckout}
                      isLoading={isProcessing}
                      rightIcon={!isProcessing ? <FiArrowRight /> : undefined}
                      spinner={<Spinner size="sm" />}
                    >
                      {isProcessing ? 'Procesando...' : 'Pagar ahora'}
                    </Button>
                  </VStack>

                  <Button
                    variant="outline"
                    colorScheme="red"
                    w="full"
                    mt={4}
                    onClick={clearCart}
                    leftIcon={<FiTrash2 />}
                  >
                    Vaciar Carrito
                  </Button>
                </Box>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CartSummary;