import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Divider,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Avatar
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { ExternalLinkIcon, InfoIcon, TimeIcon } from '@chakra-ui/icons';

// Importaciones específicas para trabajo con contratos
import { getNFTContract } from '../utils/nftContract';
import { NETWORK_RPC_URL, NETWORK_CHAIN_ID, switchToCorrectNetwork } from '../config/network';
import { fetchIPFSJSON } from '../utils/ipfs';
import axios from 'axios';

// Interfaces para tipado
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
}

interface NFT {
  tokenId: string;
  owner: string;
  metadata: NFTMetadata | null;
  price: string;
}

interface NFTActivity {
  type: 'mint' | 'transfer' | 'sale' | 'listing';
  from: string;
  to: string;
  price?: string;
  timestamp: number;
  txHash: string;
}

const NFTDetailPage: React.FC = () => {
  const { collectionAddress, tokenId } = useParams<{ collectionAddress: string; tokenId: string }>();
  const [nft, setNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPurchase, setLoadingPurchase] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [activity, setActivity] = useState<NFTActivity[]>([]);
  const [email, setEmail] = useState<string>('');
  const [walletConnecting, setWalletConnecting] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Función para conectar la wallet con mejor manejo de errores y reintentos
  const connectWallet = async () => {
    try {
      setWalletConnecting(true);
      const { ethereum } = window as any;
      
      if (!ethereum) {
        toast({
          title: "MetaMask no detectado",
          description: "Por favor instala MetaMask para usar esta aplicación",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Intentar cambiar a la red correcta con timeout
      const networkPromise = switchToCorrectNetwork();
      const networkTimeout = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000);
      });
      
      const networkResult = await Promise.race([networkPromise, networkTimeout]);
      
      if (!networkResult) {
        console.warn("Tiempo de espera agotado al cambiar de red, continuando de todos modos");
        toast({
          title: "Aviso de red",
          description: "No se pudo confirmar el cambio de red. Intentaremos continuar de todos modos.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }

      // Intentar conectar la wallet con timeout
      const accountsPromise = ethereum.request({ method: 'eth_requestAccounts' });
      const accountsTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tiempo de espera agotado al solicitar cuentas")), 10000);
      });
      
      try {
        const accounts = await Promise.race([accountsPromise, accountsTimeout]) as string[];
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setConnectionAttempts(0);
          
          toast({
            title: "Conectado",
            description: "Wallet conectada correctamente",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          
          // Recargar NFT después de conectar wallet
          fetchNFTDetails();
        } else {
          throw new Error("No se recibieron cuentas válidas");
        }
      } catch (requestError: any) {
        console.error("Error solicitando cuentas:", requestError);
        
        // Incrementar contador de intentos
        const newAttempts = connectionAttempts + 1;
        setConnectionAttempts(newAttempts);
        
        if (newAttempts < 3) {
          toast({
            title: "Reintentando conexión",
            description: `Intento ${newAttempts}/3. Por favor, responde en MetaMask.`,
            status: "info",
            duration: 3000,
            isClosable: true,
          });
          
          // Esperar 2 segundos antes de reintentar
          setTimeout(() => connectWallet(), 2000);
          return;
        } else {
          toast({
            title: "Error de conexión",
            description: "No se pudo acceder a tu wallet después de varios intentos. Por favor, intenta de nuevo más tarde.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setConnectionAttempts(0);
        }
      }
    } catch (error: any) {
      console.error("Error conectando wallet:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo conectar la wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWalletConnecting(false);
    }
  };

  // Cargar datos del NFT desde el contrato y metadatos con mejor manejo de errores
  const fetchNFTDetails = async () => {
    if (!collectionAddress || !tokenId) {
      setError('Información del NFT no disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Intentar obtener provider de múltiples fuentes con timeout
      const { ethereum } = window as any;
      let provider;
      
      try {
        if (ethereum) {
          console.log('Intentando conectar vía MetaMask...');
          
          // Usar Promise.race para establecer un timeout
          const providerPromise = new Promise<ethers.providers.Web3Provider>((resolve) => {
            const web3Provider = new ethers.providers.Web3Provider(ethereum);
            resolve(web3Provider);
          });
          
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              console.log('Timeout al conectar con MetaMask, usando fallback');
              resolve(null);
            }, 3000);
          });
          
          const result = await Promise.race([providerPromise, timeoutPromise]);
          
          if (result) {
            provider = result;
            const network = await provider.getNetwork();
            console.log('Red actual detectada:', network.name, '(', network.chainId, ')');
            
            if (network.chainId !== parseInt(NETWORK_CHAIN_ID, 16)) {
              console.log('Red incorrecta, usando fallback RPC');
              provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
            }
          } else {
            console.log('Timeout al conectar con MetaMask, usando fallback RPC');
            provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
          }
        } else {
          console.log('MetaMask no detectado, usando fallback RPC');
          provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
        }
      } catch (providerError) {
        console.error('Error al configurar el provider:', providerError);
        console.log('Usando provider de fallback RPC tras error');
        provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
      }
      
      console.log('Conectando al contrato NFT:', collectionAddress);
      
      // Intentar obtener el contrato y los datos del NFT
      try {
        const contract = await getNFTContract(provider);
        
        // Obtener el propietario del NFT
        const owner = await contract.ownerOf(tokenId);
        console.log('Propietario del NFT:', owner);
        
        // Obtener el URI del token
        const tokenURI = await contract.tokenURI(tokenId);
        console.log('Token URI:', tokenURI);
        
        // Obtener precio si existe la función en el contrato
        let price = '0';
        try {
          price = ethers.utils.formatEther(await contract.getPrice(tokenId));
          console.log('Precio del NFT:', price, 'ETH');
        } catch (priceError) {
          console.log('No se pudo obtener el precio, asumiendo 0:', priceError);
        }
        
        // Cargar metadatos desde IPFS
        let metadata: NFTMetadata | null = null;
        try {
          metadata = await fetchIPFSJSON(tokenURI);
          console.log('Metadatos cargados:', metadata);
        } catch (metadataError) {
          console.error('Error cargando metadatos:', metadataError);
          metadata = {
            name: `NFT #${tokenId}`,
            description: 'Metadatos no disponibles',
            image: 'https://via.placeholder.com/500?text=Imagen+No+Disponible'
          };
        }
        
        // Actualizar estado
        setNft({
          tokenId,
          owner,
          metadata,
          price
        });
        
        // Cargar historial de actividad (simulado por ahora)
        const mockActivity: NFTActivity[] = [
          {
            type: 'mint',
            from: '0x0000000000000000000000000000000000000000',
            to: owner,
            timestamp: Date.now() - 1000000,
            txHash: '0x' + Math.random().toString(16).substring(2, 34)
          }
        ];
        setActivity(mockActivity);
      } catch (contractError) {
        console.error('Error obteniendo datos del contrato:', contractError);
        throw new Error('No se pudieron cargar los datos del NFT');
      }
    } catch (error: any) {
      console.error('Error al cargar NFT:', error);
      setError(error.message || 'No se pudo cargar el NFT');
    } finally {
      setLoading(false);
    }
  };
  
  // Comprobar si ya hay una wallet conectada al cargar la página
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { ethereum } = window as any;
        if (ethereum) {
          // Actualizar estado cuando cambian las cuentas
          ethereum.on('accountsChanged', handleAccountsChanged);
          
          // Intentar obtener cuentas ya conectadas
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            console.log('Wallet ya conectada:', accounts[0]);
            setAccount(accounts[0]);
          } else {
            console.log('No hay wallet conectada');
          }
        }
      } catch (error) {
        console.error('Error comprobando conexión:', error);
      }
      
      // Cargar datos del NFT independientemente de si hay wallet conectada
      fetchNFTDetails();
    };
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Usuario desconectó su wallet
        console.log('Wallet desconectada');
        setAccount(null);
        toast({
          title: "Wallet desconectada",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Usuario cambió a otra cuenta
        console.log('Cuenta cambiada a:', accounts[0]);
        setAccount(accounts[0]);
        // Recargar datos del NFT con la nueva cuenta
        fetchNFTDetails();
      }
    };
    
    checkConnection();
    
    // Limpieza del efecto
    return () => {
      const { ethereum } = window as any;
      if (ethereum && ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [tokenId, collectionAddress]);
  
  // Función para manejar la compra del NFT
  const handlePurchase = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!nft) return;
    
    try {
      setLoadingPurchase(true);
      
      // Preparar datos para la API de compra
      const purchaseData = {
        collectionAddress,
        tokenId,
        email,
        price: nft.price
      };
      
      // Enviar solicitud a la API de backend
      const response = await axios.post('/api/create-checkout-session', purchaseData);
      
      // Redirigir a la página de pago de Stripe
      window.location.href = response.data.url;
      
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la compra",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingPurchase(false);
    }
  };
  
  // Función para abrir modal de compra
  const openPurchaseModal = () => {
    if (!account) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor conecta tu wallet para comprar este NFT",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onOpen();
  };
  
  // Comprar con criptomoneda
  const handleCryptoPurchase = async () => {
    // Código para manejar la compra con cripto...
  };
  
  // Comprar con tarjeta
  const handleCardPurchase = async () => {
    // Código para manejar la compra con tarjeta...
  };

  // Renderizado condicional según el estado de carga
  if (loading) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Cargando detalles del NFT...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <VStack spacing={4}>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
            <Heading size="md">Error al cargar el NFT</Heading>
            <Text mt={4}>{error}</Text>
            <Button mt={4} colorScheme="blue" onClick={fetchNFTDetails}>
              Reintentar
            </Button>
          </Box>
        </VStack>
      </Container>
    );
  }

  // Renderizar detalles del NFT cuando esté disponible
  return (
    <Container maxW="container.xl" py={8}>
      {nft && (
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
          {/* Imagen del NFT */}
          <GridItem>
            <Box
              borderRadius="lg"
              overflow="hidden"
              boxShadow="xl"
              position="relative"
            >
              <Image
                src={nft.metadata?.image}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                w="100%"
                objectFit="cover"
                fallback={<Box bg="gray.100" h="500px" display="flex" alignItems="center" justifyContent="center">
                  <Text>Imagen no disponible</Text>
                </Box>}
              />
            </Box>
          </GridItem>

          {/* Detalles del NFT */}
          <GridItem>
            <VStack align="start" spacing={6}>
              <Box w="100%">
                <Flex justifyContent="space-between" alignItems="center" w="100%">
                  <Heading size="xl">{nft.metadata?.name || `NFT #${nft.tokenId}`}</Heading>
                  
                  {/* Botón de conectar wallet */}
                  {!account ? (
                    <Button
                      colorScheme="blue"
                      onClick={connectWallet}
                      isLoading={walletConnecting}
                      loadingText="Conectando..."
                    >
                      Conectar Wallet
                    </Button>
                  ) : (
                    <Badge colorScheme="green" p={2} borderRadius="md">
                      Wallet Conectada
                    </Badge>
                  )}
                </Flex>
                
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Token ID: {nft.tokenId}
                </Text>
              </Box>

              <Divider />

              {/* Precio y acciones */}
              <Box w="100%">
                <Stat>
                  <StatLabel>Precio</StatLabel>
                  <StatNumber>{nft.price} ETH</StatNumber>
                  <StatHelpText>
                    ≈ ${parseFloat(nft.price) * 3000} USD
                  </StatHelpText>
                </Stat>

                <HStack spacing={4} mt={4}>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    w="full"
                    onClick={openPurchaseModal}
                  >
                    Comprar NFT
                  </Button>
                </HStack>
              </Box>

              <Divider />

              {/* Descripción */}
              <Box w="100%">
                <Heading size="md" mb={3}>Descripción</Heading>
                <Text>{nft.metadata?.description || "Sin descripción"}</Text>
              </Box>

              <Divider />

              {/* Atributos */}
              <Box w="100%">
                <Heading size="md" mb={3}>Atributos</Heading>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  {nft.metadata?.attributes && nft.metadata.attributes.length > 0 ? (
                    nft.metadata.attributes.map((attr, index) => (
                      <Box
                        key={index}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        textAlign="center"
                      >
                        <Text fontSize="xs" fontWeight="bold" color="gray.500">
                          {attr.trait_type}
                        </Text>
                        <Text fontSize="md" fontWeight="bold">
                          {attr.value}
                        </Text>
                      </Box>
                    ))
                  ) : (
                    <Text>Sin atributos</Text>
                  )}
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Detalles del propietario */}
              <Box w="100%">
                <Heading size="md" mb={3}>Propietario</Heading>
                <HStack spacing={3}>
                  <Avatar size="sm" name={nft.owner} />
                  <Text isTruncated>
                    {nft.owner}
                  </Text>
                  <IconButton
                    aria-label="Ver en explorador"
                    icon={<ExternalLinkIcon />}
                    size="sm"
                    variant="ghost"
                    as="a"
                    href={`https://sepolia.arbiscan.io/address/${nft.owner}`}
                    target="_blank"
                  />
                </HStack>
              </Box>
            </VStack>
          </GridItem>

          {/* Actividad y detalles */}
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Tabs isFitted variant="enclosed" mt={8}>
              <TabList>
                <Tab>Actividad</Tab>
                <Tab>Detalles</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {activity.length > 0 ? (
                    <VStack align="stretch" spacing={4}>
                      {activity.map((event, index) => (
                        <Box
                          key={index}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                        >
                          <HStack justify="space-between">
                            <HStack>
                              <TimeIcon />
                              <Text fontWeight="bold">
                                {event.type === 'mint' ? 'Creación' : 
                                 event.type === 'transfer' ? 'Transferencia' : 
                                 event.type === 'sale' ? 'Venta' : 'Listado'}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </Text>
                          </HStack>
                          <HStack mt={2} spacing={1}>
                            <Text fontSize="sm">De:</Text>
                            <Text fontSize="sm" fontWeight="bold" isTruncated>
                              {event.from === '0x0000000000000000000000000000000000000000' 
                               ? 'Nueva Creación' 
                               : event.from}
                            </Text>
                          </HStack>
                          <HStack mt={1} spacing={1}>
                            <Text fontSize="sm">A:</Text>
                            <Text fontSize="sm" fontWeight="bold" isTruncated>
                              {event.to}
                            </Text>
                          </HStack>
                          {event.price && (
                            <Text mt={2} fontWeight="bold">
                              {event.price} ETH
                            </Text>
                          )}
                          <HStack mt={2}>
                            <IconButton
                              aria-label="Ver transacción"
                              icon={<ExternalLinkIcon />}
                              size="xs"
                              variant="outline"
                              as="a"
                              href={`https://sepolia.arbiscan.io/tx/${event.txHash}`}
                              target="_blank"
                            />
                            <Text fontSize="xs" color="gray.500">
                              Ver transacción
                            </Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text>No hay actividad para mostrar</Text>
                  )}
                </TabPanel>
                <TabPanel>
                  <VStack align="start" spacing={4}>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold">Dirección del contrato</Text>
                      <HStack>
                        <Text isTruncated maxW="300px">{collectionAddress}</Text>
                        <IconButton
                          aria-label="Ver en explorador"
                          icon={<ExternalLinkIcon />}
                          size="sm"
                          variant="ghost"
                          as="a"
                          href={`https://sepolia.arbiscan.io/address/${collectionAddress}`}
                          target="_blank"
                        />
                      </HStack>
                    </HStack>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold">Token ID</Text>
                      <Text>{nft.tokenId}</Text>
                    </HStack>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold">Estándar de token</Text>
                      <Text>ERC-721</Text>
                    </HStack>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold">Red</Text>
                      <Text>Arbitrum Sepolia</Text>
                    </HStack>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </GridItem>
        </Grid>
      )}

      {/* Modal de compra */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Comprar NFT</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Estás a punto de comprar: <strong>{nft?.metadata?.name}</strong>
              </Text>
              <Text fontWeight="bold">
                Precio: {nft?.price} ETH (≈ ${parseFloat(nft?.price || '0') * 3000} USD)
              </Text>
              
              <Divider />
              
              <Text fontWeight="bold">Método de pago:</Text>
              <HStack spacing={4} width="100%">
                <Button 
                  flex={1} 
                  onClick={handleCryptoPurchase}
                  colorScheme="blue"
                >
                  Crypto (ETH)
                </Button>
                <Button 
                  flex={1} 
                  onClick={onOpen}
                  colorScheme="green"
                >
                  Tarjeta
                </Button>
              </HStack>
              
              <Divider />
              
              <FormControl>
                <FormLabel>Email para confirmación</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default NFTDetailPage; 