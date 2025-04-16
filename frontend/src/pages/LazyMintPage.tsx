import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Button,
  Image,
  Stack,
  SimpleGrid,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Badge,
  Flex,
  useColorModeValue,
  VStack,
  HStack,
  Skeleton,
} from '@chakra-ui/react';
import { InfoIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import { getAvailableNFTIds, getAvailableNFTInfo, purchaseAndMintNFT, purchaseNFTWithStripe } from '../utils/lazyMintContract';
import { fetchIPFSJSON, getIPFSUrl } from '../utils/ipfs';
import { NETWORK_RPC_URL, switchToCorrectNetwork } from '../config/network';

// Interfaz para los metadatos de NFT
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  originalImage?: string;
  displayImage?: string;
}

// Interfaz para NFT disponible
interface AvailableNFT {
  lazyId: string;
  metadataURI: string;
  price: string;
  royaltyPercentage: number;
  isActive: boolean;
  metadata?: NFTMetadata;
  baseType?: string; // Tipo base del NFT (ej: "Kachitomío#L")
}

// Interfaz para NFTs agrupados
interface GroupedNFT {
  baseType: string;
  nfts: AvailableNFT[];
  totalCount: number;
  metadata?: NFTMetadata;
  price: string;
}

const LazyMintPage: React.FC = () => {
  const [availableNFTs, setAvailableNFTs] = useState<AvailableNFT[]>([]);
  const [groupedNFTs, setGroupedNFTs] = useState<GroupedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<AvailableNFT | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedNFT | null>(null);
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [connectingWallet, setConnectingWallet] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPurchaseOpen, onOpen: onPurchaseOpen, onClose: onPurchaseClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Cargar los NFTs disponibles
  useEffect(() => {
    loadAvailableNFTs();
    checkWalletConnection();
  }, []);
  
  // Agrupar NFTs cuando cambia availableNFTs
  useEffect(() => {
    if (availableNFTs.length > 0) {
      groupNFTs(availableNFTs);
    }
  }, [availableNFTs]);
  
  // Función para agrupar NFTs por tipo
  const groupNFTs = (nfts: AvailableNFT[]) => {
    const grouped: Record<string, GroupedNFT> = {};
    
    nfts.forEach(nft => {
      // Extraer el tipo base del NFT (todo antes del último #)
      const baseType = nft.metadata?.name?.split(' #')[0] || nft.lazyId.split('-')[0];
      nft.baseType = baseType;
      
      if (!grouped[baseType]) {
        grouped[baseType] = {
          baseType,
          nfts: [],
          totalCount: 0, // No hardcodeamos este valor
          price: nft.price,
          metadata: nft.metadata
        };
      }
      
      grouped[baseType].nfts.push(nft);
    });
    
    setGroupedNFTs(Object.values(grouped));
  };
  
  // Comprobar si hay una wallet conectada
  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window as any;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
        
        // Escuchar cambios en las cuentas
        ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
          } else {
            setAccount(null);
          }
        });
      }
    } catch (error) {
      console.error('Error al comprobar la conexión de la wallet:', error);
    }
  };
  
  // Cargar los NFTs disponibles para lazy minting
  const loadAvailableNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Crear un provider
      const provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
      
      // Obtener los IDs de NFTs disponibles
      const availableIds = await getAvailableNFTIds(provider);
      console.log('NFTs disponibles:', availableIds);
      
      if (availableIds.length === 0) {
        setError('No hay NFTs disponibles para mintear en este momento.');
        setLoading(false);
        return;
      }
      
      // Inicializar array con información básica
      const nftsBasic: AvailableNFT[] = [];
      
      // Obtener información básica de cada NFT
      for (const lazyId of availableIds) {
        try {
          const nftInfo = await getAvailableNFTInfo(lazyId, provider);
          
          if (nftInfo.isActive) {
            nftsBasic.push({
              lazyId,
              metadataURI: nftInfo.metadataURI,
              price: nftInfo.price,
              royaltyPercentage: nftInfo.royaltyPercentage,
              isActive: nftInfo.isActive
            });
          }
        } catch (err) {
          console.error(`Error obteniendo info de NFT ${lazyId}:`, err);
        }
      }
      
      setAvailableNFTs(nftsBasic);
      setLoading(false);
      
      // Cargar los metadatos en segundo plano
      loadNFTMetadata(nftsBasic);
      
    } catch (error) {
      console.error('Error cargando NFTs disponibles:', error);
      setError('Error al cargar los NFTs disponibles. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  // Cargar los metadatos de los NFTs
  const loadNFTMetadata = async (nfts: AvailableNFT[]) => {
    try {
      setLoadingMetadata(true);
      
      const nftsWithMetadata = [...nfts];
      
      for (let i = 0; i < nftsWithMetadata.length; i++) {
        try {
          // Obtener metadatos - mantiene el formato ipfs:// para OpenSea
          const metadata = await fetchIPFSJSON(nftsWithMetadata[i].metadataURI);
          
          // Para visualización en la interfaz, necesitamos una versión HTTP de la URL
          if (metadata && metadata.image) {
            // Guardamos la URL original para uso interno (OpenSea necesita el formato ipfs://)
            metadata.originalImage = metadata.image;
            
            // Para la visualización en la interfaz, usamos una versión HTTP
            metadata.displayImage = getIPFSUrl(metadata.image);
            
            console.log('Metadata cargada para', nftsWithMetadata[i].lazyId);
            console.log('- URL para OpenSea:', metadata.image);
            console.log('- URL para visualización:', metadata.displayImage);
          }
          
          nftsWithMetadata[i].metadata = metadata;
        } catch (err) {
          console.error(`Error cargando metadatos para NFT ${nftsWithMetadata[i].lazyId}:`, err);
        }
      }
      
      setAvailableNFTs(nftsWithMetadata);
      setLoadingMetadata(false);
    } catch (error) {
      console.error('Error cargando metadatos:', error);
      setLoadingMetadata(false);
    }
  };
  
  // Conectar wallet
  const connectWallet = async () => {
    try {
      setConnectingWallet(true);
      
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "MetaMask no detectado",
          description: "Por favor instala MetaMask para comprar NFTs.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Cambiar a la red correcta
      await switchToCorrectNetwork();
      
      // Solicitar cuentas
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      toast({
        title: "Wallet conectada",
        description: "Tu wallet se ha conectado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar la wallet.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setConnectingWallet(false);
    }
  };
  
  // Abrir modal de compra para el grupo
  const handleGroupBuyClick = (group: GroupedNFT) => {
    setSelectedGroup(group);
    // Elegir el primer NFT disponible del grupo
    setSelectedNFT(group.nfts[0]);
    onOpen();
  };
  
  // Comprar con crypto (mintear directamente)
  const handleCryptoPurchase = async () => {
    if (!selectedNFT) return;
    if (!account) {
      toast({
        title: "Wallet no conectada",
        description: "Necesitas conectar tu wallet para comprar con cripto.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setMintingStatus('loading');
      
      // Obtener provider y signer
      const { ethereum } = window as any;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      
      console.log(`Iniciando compra del NFT: ${selectedNFT.lazyId}`);
      console.log(`Usando cuenta: ${await signer.getAddress()}`);
      
      // Mintear el NFT
      const result = await purchaseAndMintNFT(selectedNFT.lazyId, signer);
      
      if (result.success) {
        const tokenIdMessage = result.tokenId === 'nuevo' 
          ? "NFT minteado exitosamente" 
          : `Token ID: ${result.tokenId}`;
        
        toast({
          title: "¡NFT comprado!",
          description: `El NFT se ha minteado correctamente. ${tokenIdMessage}`,
          status: "success",
          duration: 10000,
          isClosable: true,
        });
        
        setMintingStatus('success');
        
        // Eliminar el NFT de la lista (ya no está disponible)
        const updatedNFTs = availableNFTs.filter(nft => nft.lazyId !== selectedNFT.lazyId);
        setAvailableNFTs(updatedNFTs);
        
        // También actualizar el grupo actual
        if (selectedGroup) {
          const updatedGroup = {...selectedGroup};
          updatedGroup.nfts = updatedGroup.nfts.filter(nft => nft.lazyId !== selectedNFT.lazyId);
          setSelectedGroup(updatedGroup);
        }
        
        // Cerrar el modal después de un momento
        setTimeout(() => {
          onClose();
          setMintingStatus('idle');
          setSelectedNFT(null);
          setSelectedGroup(null);
          
          // Recargar la lista completa para asegurar datos actualizados
          loadAvailableNFTs();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error minteando NFT con cripto:', error);
      
      // Verificar si a pesar del error, la transacción se completó
      // (a veces el error es en el procesamiento del evento, pero el NFT se mintea correctamente)
      if (error.message?.includes("Cannot read properties of undefined")) {
        toast({
          title: "Posible éxito con error",
          description: "Parece que tu NFT se ha minteado, pero hubo un error al procesar el evento. Por favor, verifica tu wallet o actualiza la página.",
          status: "warning",
          duration: 10000,
          isClosable: true,
        });
        
        // Recargar la lista para asegurar datos actualizados
        loadAvailableNFTs();
        
        // Cerrar el modal después de un momento
        setTimeout(() => {
          onClose();
          setMintingStatus('idle');
        }, 5000);
        
        return;
      }
      
      // Mensajes más específicos según el tipo de error
      let errorMessage = "Error al comprar el NFT. Por favor, intenta de nuevo.";
      
      if (error.message?.includes("user rejected") || error.code === 4001) {
        errorMessage = "Has rechazado la transacción en tu wallet.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Fondos insuficientes en tu wallet para completar esta compra.";
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "La transacción falló en el contrato. Puede que el NFT ya no esté disponible.";
      } else if (error.message?.includes("No se pudo obtener el precio")) {
        errorMessage = "No se pudo determinar el precio del NFT. Por favor, actualiza la página.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 10000,
        isClosable: true,
      });
      
      // Si el error es por NFT no disponible, actualizar la lista
      if (error.message?.includes("ya no está disponible")) {
        loadAvailableNFTs();
      }
      
      setMintingStatus('error');
    }
  };
  
  // Abrir modal de compra con tarjeta
  const handleCardPurchase = () => {
    onClose();
    onPurchaseOpen();
  };
  
  // Comprar con tarjeta
  const handleStripePurchase = async () => {
    if (!selectedNFT) return;
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Por favor introduce un email válido para continuar.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setMintingStatus('loading');
      
      // Iniciar proceso de compra con Stripe
      const result = await purchaseNFTWithStripe(
        selectedNFT.lazyId,
        email
      );
      
      // Redireccionar a la página de pago de Stripe
      window.location.href = result.url;
    } catch (error: any) {
      console.error('Error iniciando compra con Stripe:', error);
      toast({
        title: "Error",
        description: error.message || "Error al iniciar el proceso de pago. Por favor, intenta de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setMintingStatus('error');
    }
  };
  
  // Renderizado condicional para el estado de carga
  if (loading) {
    return (
      <Container maxW="container.xl" py={12} centerContent>
        <VStack spacing={6}>
          <Spinner size="xl" />
          <Text>Cargando NFTs disponibles...</Text>
        </VStack>
      </Container>
    );
  }
  
  // Renderizado condicional para errores
  if (error) {
    return (
      <Container maxW="container.xl" py={12} centerContent>
        <VStack spacing={4}>
          <InfoIcon boxSize={12} color="red.500" />
          <Heading size="lg">Algo salió mal</Heading>
          <Text>{error}</Text>
          <Button colorScheme="blue" onClick={loadAvailableNFTs}>
            Intentar de nuevo
          </Button>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={24}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="2xl" mb={4}>Kachitomio</Heading>
          <Text fontSize="xl" maxW="2xl" mx="auto">
            Siete intervenciones digitales de un negativo fotográfico analógico realizado en Munich en 2017
          </Text>
          
          {!account && (
            <Button 
              mt={6} 
              colorScheme="teal" 
              size="lg"
              onClick={connectWallet}
              isLoading={connectingWallet}
              loadingText="Conectando..."
            >
              Conectar Wallet
            </Button>
          )}
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {groupedNFTs.map((group) => (
            <Card 
              key={group.baseType}
              overflow="hidden"
              variant="outline"
              borderColor={borderColor}
              bg={bgColor}
              borderRadius="lg"
              _hover={{
                transform: 'translateY(-5px)',
                boxShadow: 'xl',
                transition: 'all 0.3s ease'
              }}
            >
              {loadingMetadata && !group.metadata ? (
                <Skeleton height="300px" />
              ) : (
                <Image
                  src={group.metadata?.displayImage || group.metadata?.image || '/placeholder-nft.png'}
                  alt={group.baseType}
                  height="300px"
                  objectFit="cover"
                  fallback={<Box bg="gray.100" height="300px" />}
                />
              )}
              
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">
                    {loadingMetadata && !group.metadata ? (
                      <Skeleton height="24px" width="80%" />
                    ) : (
                      group.baseType
                    )}
                  </Heading>
                  
                  <HStack>
                    <Badge colorScheme="green">Precio</Badge>
                    <Text fontWeight="bold">{group.price} ETH</Text>
                  </HStack>
                  
                  <HStack>
                    <Badge colorScheme="blue">Disponibilidad</Badge>
                    <Text fontWeight="bold">{group.nfts.length} disponibles</Text>
                  </HStack>
                  
                  {loadingMetadata && !group.metadata ? (
                    <Skeleton height="60px" />
                  ) : (
                    <Text noOfLines={2}>
                      {group.metadata?.description || 'Descripción no disponible'}
                    </Text>
                  )}
                </Stack>
              </CardBody>
              
              <Divider />
              
              <CardFooter>
                {!account ? (
                  <Button 
                    colorScheme="blue" 
                    width="full"
                    onClick={connectWallet}
                  >
                    Conectar Wallet
                  </Button>
                ) : (
                  <Button 
                    colorScheme="blue" 
                    width="full"
                    onClick={() => handleGroupBuyClick(group)}
                    isDisabled={group.nfts.length === 0}
                  >
                    Comprar NFT
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
      
      {/* Modal de selección de método de pago */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Comprar NFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNFT && selectedGroup && (
              <VStack spacing={4} align="stretch">
                <Image
                  src={selectedNFT.metadata?.displayImage || selectedNFT.metadata?.image || '/placeholder-nft.png'}
                  alt={selectedNFT.metadata?.name || selectedNFT.lazyId}
                  borderRadius="md"
                  fallback={<Box bg="gray.100" height="200px" />}
                />
                
                <Heading size="md">
                  {selectedGroup.baseType}
                </Heading>
                
                <Badge colorScheme="blue" alignSelf="start">
                  {selectedGroup.nfts.length} disponibles
                </Badge>
                
                <Text>
                  {selectedNFT.metadata?.description || 'Sin descripción disponible'}
                </Text>
                
                <Box>
                  <Text fontWeight="bold" display="inline">Precio:</Text>
                  <Text display="inline" ml={2}>20€ (precio fijo)</Text>
                </Box>
                
                <Divider />
                
                <Text fontWeight="bold">Selecciona método de pago:</Text>
                
                <HStack spacing={4}>
                  <Button 
                    flex={1} 
                    colorScheme="blue" 
                    onClick={handleCryptoPurchase}
                    isLoading={mintingStatus === 'loading'}
                    isDisabled={!account || mintingStatus === 'loading'}
                  >
                    Pagar con Crypto
                  </Button>
                  
                  <Button 
                    flex={1} 
                    colorScheme="green" 
                    onClick={handleCardPurchase}
                    isDisabled={mintingStatus === 'loading'}
                  >
                    Pagar con Tarjeta
                  </Button>
                </HStack>
                
                {!account && (
                  <Text color="red.500" fontSize="sm">
                    * Necesitas conectar tu wallet para pagar con crypto
                  </Text>
                )}
                
                {mintingStatus === 'success' && (
                  <Box p={3} bg="green.100" color="green.800" borderRadius="md">
                    ¡NFT minteado con éxito! Pronto aparecerá en tu wallet.
                  </Box>
                )}
                
                {mintingStatus === 'error' && (
                  <Box p={3} bg="red.100" color="red.800" borderRadius="md">
                    Error al mintear el NFT. Por favor, intenta de nuevo.
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de pago con tarjeta */}
      <Modal isOpen={isPurchaseOpen} onClose={onPurchaseClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pago con Tarjeta</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNFT && selectedGroup && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Estás a punto de comprar:
                </Text>
                <Text fontWeight="bold">
                  {selectedGroup.baseType} ({selectedGroup.nfts.length} disponibles)
                </Text>
                
                <Box>
                  <Text fontWeight="bold" display="inline">
                    Precio:
                  </Text>
                  <Text display="inline" ml={2}>
                    20€ (precio fijo)
                  </Text>
                </Box>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormControl>
                
                <Text fontSize="sm" color="gray.600">
                  Recibirás actualizaciones sobre tu compra en este email.
                  El NFT se minteará automáticamente para ti después del pago.
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPurchaseClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleStripePurchase} 
              isLoading={mintingStatus === 'loading'}
              loadingText="Procesando..."
            >
              Proceder al Pago
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default LazyMintPage; 