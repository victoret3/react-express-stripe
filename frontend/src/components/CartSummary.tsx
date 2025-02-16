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
} from '@chakra-ui/react';
import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { loadStripe } from '@stripe/stripe-js';

// Cargar Stripe con la clave pública
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

const CartSummary: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular el total del carrito
  const totalAmount = cart.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío. Añade productos antes de pagar.');
      return;
    }

    setIsProcessing(true);

    const lineItems = cart.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name || 'Producto sin nombre',
          description: item.description || '',
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: 1,
    }));

    try {
      const response = await fetch('http://localhost:8888/payment/session-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineItems,
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        }),
      });

      const session = await response.json();

      if (!response.ok) {
        console.error('Error en la respuesta del servidor:', session);
        throw new Error(session.error || 'Error desconocido al iniciar la sesión de Stripe');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe no está disponible.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) {
        throw new Error(error.message);
      }

      clearCart();
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Hubo un error al procesar tu pago. Por favor, inténtalo nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Box position="relative">
        <IconButton
          icon={<FiShoppingCart />}
          aria-label="Ver carrito"
          onClick={() => setDrawerOpen(true)}
        />
        {cart.length > 0 && (
          <Badge
            position="absolute"
            top="-2"
            right="-2"
            colorScheme="red"
            borderRadius="full"
            px={2}
          >
            {cart.length}
          </Badge>
        )}
      </Box>

      <Drawer isOpen={isDrawerOpen} placement="right" onClose={() => setDrawerOpen(false)}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4} align="start">
              {cart.map((item) => (
                <Box key={item.id} w="100%" display="flex" justifyContent="space-between">
                  <Image src={item.image} alt={item.name || 'Imagen del producto'} boxSize="50px" borderRadius="md" />
                  <Box>
                    <Text fontWeight="bold">{item.name || 'Producto sin nombre'}</Text>
                    <Text>€{(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}</Text>
                  </Box>
                  <Button size="sm" colorScheme="red" onClick={() => removeFromCart(item.id)}>
                    Eliminar
                  </Button>
                </Box>
              ))}
            </VStack>

            {/* Total y botón de pagar */}
            <Box mt={4}>
              <Text fontWeight="bold">Total: €{totalAmount.toFixed(2)}</Text>
              <Button
                colorScheme="blue"
                mt={4}
                w="100%"
                onClick={handleCheckout}
                isLoading={isProcessing}
              >
                Pagar
              </Button>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CartSummary;
