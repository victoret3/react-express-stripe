// Success.tsx
import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Success: React.FC = () => {
  return (
    <Box textAlign="center" p={10}>
      <Heading size="xl" mb={4}>
        ¡Compra Exitosa!
      </Heading>
      <Text fontSize="lg">
        Gracias por tu compra. Recibirás un correo electrónico con los detalles.
      </Text>
    </Box>
  );
};

export default Success;