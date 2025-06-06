// Success.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Divider,
  useToast,
  Image,
  HStack,
  SimpleGrid,
  Input
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  mongoProductId?: string | null;
}

interface OrderInfo {
  orderNumber: string;
  email: string;
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

const Success: React.FC = () => {
  const location = useLocation();
  const toast = useToast();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockUpdated, setStockUpdated] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');
  
  // Función para actualizar el stock - Solución alternativa
  const updateProductStock = async (productId: string, quantity: number) => {
    try {
      console.log('Intentando actualizar stock para:', productId, 'cantidad:', quantity);
      const response = await axios.post(
        'https://nani-boronat-api.vercel.app/api/payment/update-simple',
        { productId, quantity }
      );
      
      console.log('Respuesta actualización stock:', response.data);
      if (response.data.success) {
        setStockUpdated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      return false;
    }
  };
  
  const fetchOrderDetails = async (sid: string | null) => {
    if (!sid) {
      console.error('No session ID provided');
      setLoading(false);
      setError('No se pudo encontrar el ID de sesión. Por favor, verifica tu correo para los detalles del pedido.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Requesting order details from API...');
      const apiUrl = `${process.env.REACT_APP_API_URL}/payment/order?sessionId=${sid}`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('Response received:', response.status, response.data);
      
      if (response.data && response.data.order) {
        console.log('Order details found:', response.data.order);
        setOrderInfo(response.data.order);
        setError(null);
        
        // Una vez que tenemos los detalles del pedido, actualizamos el stock de cada producto
        if (response.data.order.items) {
          console.log('Items found in order:', response.data.order.items.length);
          for (const item of response.data.order.items) {
            // Usamos directamente el mongoProductId si está disponible
            if (item.mongoProductId) {
              console.log(`Producto con ID de MongoDB encontrado: ${item.mongoProductId}`);
              await updateProductStock(item.mongoProductId, item.quantity);
            } else {
              console.log(`Producto sin ID de MongoDB: ${item.id}`);
            }
          }
        }
      } else {
        // Si no hay datos o el formato es incorrecto
        setError('No se pudo recuperar la información del pedido.');
      }
    } catch (err) {
      console.error('Error al obtener detalles del pedido:', err);
      setError('No se pudieron obtener los detalles del pedido');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrderDetails(sessionId);
  }, [sessionId]);

  const handleManualSearch = () => {
    if (manualSessionId.trim()) {
      fetchOrderDetails(manualSessionId.trim());
    } else {
      toast({
        title: "ID de sesión requerido",
        description: "Por favor, introduce un ID de sesión válido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={24} centerContent>
        <VStack spacing={6}>
          <Spinner size="xl" />
          <Text>Procesando tu pedido...</Text>
        </VStack>
      </Container>
    );
  }
  
  if (error || !sessionId) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'No se pudo verificar la información de tu pedido. Por favor, contacta con soporte.'}
          </AlertDescription>
        </Alert>
        
        <Button as={Link} to="/tienda-online" mt={6} colorScheme="blue">
          Volver a la tienda
        </Button>
      </Container>
    );
  }
  
  if (!orderInfo) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Información no disponible</AlertTitle>
          <AlertDescription>
            No pudimos recuperar los detalles de tu pedido en este momento.
          </AlertDescription>
        </Alert>
        
        <Button as={Link} to="/tienda-online" mt={6} colorScheme="blue">
          Volver a la tienda
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        {error ? (
          <>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Error al cargar detalles</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            
            {/* Búsqueda manual por ID de sesión */}
            <Box mt={4} p={6} borderWidth="1px" borderRadius="md">
              <VStack spacing={4} align="stretch">
                <Heading size="sm">¿Tienes el ID de sesión de tu pedido?</Heading>
                <Text>Si tienes el ID de sesión en tu correo electrónico, puedes buscarlo aquí.</Text>
                <HStack>
                  <Input 
                    placeholder="Introduce el ID de sesión" 
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                  />
                  <Button colorScheme="blue" onClick={handleManualSearch}>
                    Buscar
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </>
        ) : (
          <>
            <Box textAlign="center">
              <CheckCircleIcon w={12} h={12} color="green.500" mb={4} />
              <Heading size="lg" mb={2}>¡Compra Exitosa!</Heading>
              <Text fontSize="lg">
                Tu pedido ha sido procesado correctamente. Recibirás un correo electrónico con los detalles.
              </Text>
            </Box>
          </>
        )}
        
        {orderInfo && (
          <Box 
            p={6} 
            borderWidth="1px" 
            borderRadius="lg" 
            borderColor="green.200"
            bg="green.50"
          >
            <VStack spacing={4} align="stretch">
              <Heading size="md">Detalles de tu pedido</Heading>
              
              <Text>
                <strong>Número de pedido:</strong> #{orderInfo.orderNumber}
              </Text>
              
              <Text>
                <strong>Fecha:</strong> {new Date(orderInfo.createdAt).toLocaleDateString()}
              </Text>
              
              <Divider />
              
              <Heading size="sm" mt={2}>Artículos</Heading>
              
              {orderInfo.items.map((item) => (
                <Box key={item.id} p={3} borderWidth="1px" borderRadius="md" bg="white">
                  <HStack>
                    {item.image && (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        boxSize="50px" 
                        objectFit="cover" 
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" flex={1}>
                      <Text fontWeight="bold">{item.name}</Text>
                      <Text fontSize="sm">Cantidad: {item.quantity}</Text>
                    </VStack>
                    <Text fontWeight="bold">{item.price.toFixed(2)}€</Text>
                  </HStack>
                </Box>
              ))}
              
              <Box mt={4}>
                <SimpleGrid columns={2} spacingY={2}>
                  <Text>Subtotal:</Text>
                  <Text textAlign="right">
                    {orderInfo.totalAmount.toFixed(2)}€
                  </Text>
                  <Text>Envío:</Text>
                  <Text textAlign="right" color="green.600">Gratis</Text>
                  <Text fontWeight="bold">Total:</Text>
                  <Text textAlign="right" fontWeight="bold">
                    {orderInfo.totalAmount.toFixed(2)}€
                  </Text>
                </SimpleGrid>
              </Box>
              
              {orderInfo.shippingAddress && (
                <>
                  <Divider my={2} />
                  <Heading size="sm">Dirección de envío</Heading>
                  <Text>
                    {orderInfo.shippingAddress.name}<br />
                    {orderInfo.shippingAddress.address}<br />
                    {orderInfo.shippingAddress.postalCode}, {orderInfo.shippingAddress.city}<br />
                    {orderInfo.shippingAddress.country}
                  </Text>
                </>
              )}
              
              <Alert status="info" borderRadius="md" mt={2}>
                <AlertIcon />
                <VStack align="start">
                  <AlertTitle>Información de envío</AlertTitle>
                  <AlertDescription>
                    Recibirás un correo electrónico con los detalles de tu pedido y la información de seguimiento cuando tu pedido sea enviado.
                  </AlertDescription>
                </VStack>
              </Alert>
            </VStack>
          </Box>
        )}
        
        <Divider />
        
        <HStack spacing={4} justify="center">
          <Button as={Link} to="/tienda-online" colorScheme="blue">
            Volver a la tienda
          </Button>
          <Button as={Link} to="/contacto" variant="outline">
            Contactar soporte
          </Button>
        </HStack>
        
        {sessionId && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            ID de transacción: {sessionId}
          </Text>
        )}
      </VStack>
    </Container>
  );
};

export default Success;