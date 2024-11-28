import React from 'react';
import { Box, Text, Button, SimpleGrid } from '@chakra-ui/react';
import { useCart } from './CartContext';
import CartSummary from './components/CartSummary'; // Usa CartSummary para manejar el flujo de pago

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <Box p={5}>
      <Text fontSize="2xl" mb={4}>
        Carrito de Compras
      </Text>
      {cart.length === 0 ? (
        <Text>No hay productos en el carrito.</Text>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            {cart.map((item) => (
              <Box key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
                <Text fontWeight="bold">{item.name}</Text>
                <Text>Precio: €{item.price.toFixed(2)}</Text>
                <Button colorScheme="red" mt={2} onClick={() => removeFromCart(item.id)}>
                  Eliminar
                </Button>
              </Box>
            ))}
          </SimpleGrid>

          {/* Total del carrito */}
          <Box mt={4}>
            <Text fontWeight="bold">Total: €{totalAmount.toFixed(2)}</Text>
          </Box>

          {/* Botón de pagar */}
          <CartSummary />

          {/* Botón de vaciar carrito */}
          <Button colorScheme="red" mt={4} onClick={clearCart}>
            Vaciar carrito
          </Button>
        </>
      )}
    </Box>
  );
};

export default Cart;
