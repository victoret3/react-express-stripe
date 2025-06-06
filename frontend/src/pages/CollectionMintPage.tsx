import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tooltip,
  Center,
  Wrap,
  WrapItem,
  chakra
} from '@chakra-ui/react';
import { InfoIcon, CheckCircleIcon, StarIcon, LockIcon, UnlockIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import { purchaseAndMintNFT, purchaseNFTWithStripe, getAvailableNFTIds, getAvailableNFTInfo, MintResult } from '../utils/lazyMintContract';
import { fetchIPFSJSON, getIPFSUrl } from '../utils/ipfs';
import { NFT_COLLECTIONS } from '../config/contracts';
import { FaEthereum, FaCreditCard, FaWallet, FaCheck, FaRegClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getPolEurPrice } from '../utils/getPolEurPrice';

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
  baseType?: string;
}

// Interfaz para NFTs agrupados
interface GroupedNFT {
  baseType: string;
  nfts: AvailableNFT[];
  totalCount: number;
  metadata?: NFTMetadata;
  price: string;
}

// Interfaz para la colección
interface CollectionInfo {
  name: string;
  description: string;
  image?: string;
  totalSupply?: number;
}

// Componente AnimatedCard con Framer Motion
const MotionBox = chakra(motion.div);

interface AnimatedCardProps {
  children: ReactNode;
  [x: string]: any;
}

const AnimatedCard = ({ children, ...rest }: AnimatedCardProps) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 } as any}
    {...rest}
  >
    {children}
  </MotionBox>
);

const CollectionMintPage: React.FC = () => {
  const { collectionAddress } = useParams<{ collectionAddress: string }>();
  const navigate = useNavigate();

  // Estados para la colección
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [invalidCollection, setInvalidCollection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // ... (resto de hooks, sin cambios)

  const collectionConfig = NFT_COLLECTIONS.find(
    c => c.address && c.address.toLowerCase() === collectionAddress?.toLowerCase()
  );

  // Renderizar mensaje de error si no hay configuración de colección
  if (!collectionConfig) {
    return (
      <Container maxW="container.md" py={10}>
        <Box bg="red.50" borderRadius="md" p={6} textAlign="center">
          <Heading size="md" color="red.500" mb={3}>Colección no encontrada</Heading>
          <Text color="red.600">No se encontró la configuración para la colección solicitada.</Text>
        </Box>
      </Container>
    );
  }
  // Estados para NFTs
  const [availableNFTs, setAvailableNFTs] = useState<AvailableNFT[]>([]);
  const [groupedNFTs, setGroupedNFTs] = useState<GroupedNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  
  const [selectedNFT, setSelectedNFT] = useState<AvailableNFT | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedNFT | null>(null);
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [connectingWallet, setConnectingWallet] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPurchaseOpen, onOpen: onPurchaseOpen, onClose: onPurchaseClose } = useDisclosure();
  const toast = useToast();

  // Esquema de colores y estilos
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const priceBg = useColorModeValue('green.50', 'green.900');
  const priceColor = useColorModeValue('green.600', 'green.300');

  // --- ESTADO Y PRECIO POL/EUR ---
  const [polEur, setPolEur] = useState<number | null>(null);
  const [loadingPol, setLoadingPol] = useState(true);

  useEffect(() => {
    getPolEurPrice().then((price) => {
      setPolEur(price);
      setLoadingPol(false);
    }).catch(() => setLoadingPol(false));
  }, []);

  const minNftPricePol = availableNFTs.length > 0
    ? Math.min(...availableNFTs.map(nft => Number(nft.price)))
    : null;

  // Validar la dirección del contrato al cargar la página
  useEffect(() => {
    if (!collectionAddress || !ethers.utils.isAddress(collectionAddress)) {
      setInvalidCollection(true);
      setCollectionLoading(false);
      return;
    }

    loadCollectionInfo();
    loadAvailableNFTs();
    checkWalletConnection();
  }, [collectionAddress]);

  // Agrupar NFTs cuando cambia availableNFTs
  useEffect(() => {
    if (availableNFTs.length > 0) {
      groupNFTs(availableNFTs);
    }
  }, [availableNFTs]);

  // Cargar información de la colección
  const loadCollectionInfo = async () => {
    if (!collectionAddress) return;

    try {
      setCollectionLoading(true);

      // Crear un provider
      const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);

      // Usamos el ABI mínimo para obtener información básica del contrato ERC721
      const minABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function tokenURI(uint256) view returns (string)",
        "function contractURI() view returns (string)",
        "function totalSupply() view returns (uint256)"
      ];

      // Crear instancia del contrato
      const contract = new ethers.Contract(collectionAddress, minABI, provider);

      try {
        // Intentar obtener el URI del contrato si existe (OpenSea compatible)
        const contractURI = await contract.contractURI();

        if (contractURI) {
          // Obtener los metadatos de la colección desde IPFS o HTTP
          const metadata = await fetchIPFSJSON(contractURI);

          if (metadata) {
            setCollectionInfo({
              name: metadata.name || await contract.name(),
              description: metadata.description || `Colección NFT en ${collectionAddress}`,
              image: metadata.image ? getIPFSUrl(metadata.image) : undefined,
              totalSupply: metadata.total_supply || await getTotalSupply(contract)
            });
            setCollectionLoading(false);
            return;
          }
        }
      } catch (contractURIError) {}

      // Si no hay contractURI o falló, obtenemos la información básica
      try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        const totalSupply = await getTotalSupply(contract);

        setCollectionInfo({
          name: name || `Colección ${symbol}`,
          description: `Colección NFT ${symbol} en Arbitrum Sepolia`,
          totalSupply: totalSupply
        });
      } catch (basicInfoError) {
        setCollectionInfo({
          name: `Colección ${collectionAddress.slice(0, 6)}...${collectionAddress.slice(-4)}`,
          description: "Colección NFT en Arbitrum Sepolia"
        });
      }
    } catch (error) {
      console.error("Error cargando información de la colección:", error);
      setError("No se pudo cargar la información de la colección. Por favor, intenta de nuevo más tarde.");
    } finally {
      setCollectionLoading(false);
    }
  };

  // Función auxiliar para obtener el total supply de manera segura
  const getTotalSupply = async (contract: ethers.Contract): Promise<number> => {
    try {
      const supply = await contract.totalSupply();
      return supply.toNumber();
    } catch (error) {
      console.log("El contrato no tiene totalSupply:", error);
      return 0;
    }
  };

  // Cargar los NFTs disponibles desde el contrato y metadatos desde IPFS
  const loadAvailableNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Crear provider y obtener los IDs disponibles desde el contrato
      const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
      const availableIds: string[] = await getAvailableNFTIds(collectionConfig, provider);

      // 2. Obtener info on-chain de cada NFT y cargar metadatos desde IPFS
      const nftsWithInfo: AvailableNFT[] = [];
      for (const lazyId of availableIds) {
        try {
          const nftInfo = await getAvailableNFTInfo(collectionConfig, lazyId, provider);
          if (!nftInfo.isActive) continue;

          // Cargar metadatos desde IPFS
          let metadata: NFTMetadata | undefined = undefined;
          try {
            metadata = await fetchIPFSJSON(nftInfo.metadataURI);
            if (metadata && metadata.image) {
              metadata.originalImage = metadata.image;
              metadata.displayImage = getIPFSUrl(metadata.image);
            }
          } catch (err) {
            console.error(`Error cargando metadatos para NFT ${lazyId}:`, err);
          }

          nftsWithInfo.push({
            ...nftInfo,
            metadata,
          });
        } catch (err) {
          console.error(`Error obteniendo info on-chain para NFT ${lazyId}:`, err);
        }
      }

      setAvailableNFTs(nftsWithInfo);
    } catch (err) {
      console.error('Error cargando NFTs disponibles:', err);
      setError('Error al cargar los NFTs disponibles. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Función para agrupar NFTs por tipo
  const groupNFTs = (nfts: AvailableNFT[]) => {
    const grouped: Record<string, GroupedNFT> = {};

    nfts.forEach(nft => {
      const baseType = nft.metadata?.name?.split(' #')[0] || nft.lazyId.split('-')[0];
      nft.baseType = baseType;

      if (!grouped[baseType]) {
        grouped[baseType] = {
          baseType,
          nfts: [],
          totalCount: 0,
          price: nft.price,
          metadata: nft.metadata
        };
      }

      grouped[baseType].nfts.push(nft);
      grouped[baseType].totalCount++;
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

  // Desconectar wallet
  const disconnectWallet = () => {
    setAccount(null);
    toast({
      title: "Wallet desconectada",
      description: "Tu wallet se ha desconectado correctamente.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Abrir modal de compra para el grupo
  const handleGroupBuyClick = (group: GroupedNFT) => {
    setSelectedGroup(group);
    setSelectedNFT(group.nfts[0]);
    onOpen();
  };

  // Comprar con crypto (mintear directamente)
  const handleCryptoPurchase = async () => {
    if (!selectedNFT || !collectionAddress) return;
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
      const { ethereum } = window as any;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const result: MintResult = await purchaseAndMintNFT(collectionConfig, selectedNFT.lazyId, signer);

      if (result.success) {
        toast({
          title: "¡NFT comprado!",
          description: `El NFT se ha minteado correctamente. Token ID: ${result.tokenId}`,
          status: "success",
          duration: 10000,
          isClosable: true,
        });

        setMintingStatus('success');
        const updatedNFTs = availableNFTs.filter(nft => nft.lazyId !== selectedNFT.lazyId);
        setAvailableNFTs(updatedNFTs);

        if (selectedGroup) {
          const updatedGroup = { ...selectedGroup };
          updatedGroup.nfts = updatedGroup.nfts.filter(nft => nft.lazyId !== selectedNFT.lazyId);
          setSelectedGroup(updatedGroup);
        }

        setTimeout(() => {
          onClose();
          setMintingStatus('idle');
          setSelectedNFT(null);
          setSelectedGroup(null);
          loadAvailableNFTs();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error minteando NFT con cripto:', error);

      let errorMessage = "Error al comprar el NFT. Por favor, intenta de nuevo.";

      if (error.message?.includes("user rejected") || error.code === 4001) {
        errorMessage = "Has rechazado la transacción en tu wallet.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Fondos insuficientes en tu wallet para completar esta compra.";
      } else if (error.message?.includes("execution reverted")) {
        errorMessage = "La transacción falló en el contrato. Puede que el NFT ya no esté disponible.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 10000,
        isClosable: true,
      });

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
    if (!selectedNFT || !collectionAddress) return;
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
    // 1. Forzar conexión de wallet si no hay account
    let walletToUse = account;
    if (!walletToUse) {
      try {
        const { ethereum } = window as any;
        if (!ethereum) throw new Error("MetaMask no detectado");
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        walletToUse = accounts[0];
        setAccount(walletToUse);
      } catch (err) {
        toast({
          title: "Wallet no conectada",
          description: "Por favor conecta tu wallet antes de comprar con tarjeta.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    // 2. Si no hay metadataURI, recárgala del contrato
    let metadataToUse = selectedNFT.metadataURI;
    if (!metadataToUse) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
        const info = await getAvailableNFTInfo(collectionConfig, selectedNFT.lazyId, provider);
        if (info.metadataURI) {
          metadataToUse = info.metadataURI;
        }
      } catch (err) {
        toast({
          title: "Error obteniendo metadata",
          description: "No se pudo obtener la metadataURI del NFT. Intenta recargar la página.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    }
    // Validación final
    if (!walletToUse || !metadataToUse) {
      toast({
        title: "Faltan datos para mintear",
        description: "Asegúrate de tener la wallet conectada y que el NFT tenga metadataURI.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    // --- DEBUG LOG ---
    console.log("[DEBUG] Enviando a Stripe:", {
      lazyId: selectedNFT.lazyId,
      email,
      contractAddress: collectionConfig.address,
      walletAddress: walletToUse,
      metadataUrl: metadataToUse,
    });
    try {
      setMintingStatus('loading');
      // Calculate amount in cents: (POL price in euros) * polEur, then to cents and rounded
      const amountInCents = polEur && selectedNFT
        ? Math.round((Number(selectedNFT.price) / 100) * polEur * 100)
        : undefined;
      const result = await purchaseNFTWithStripe(
        selectedNFT.lazyId,
        email,
        collectionConfig,
        walletToUse,
        metadataToUse,
        amountInCents
      );
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

  // Si la colección no es válida
  if (invalidCollection) {
    return (
      <Container maxW="container.xl" py={12} centerContent>
        <AnimatedCard>
          <Box 
            p={8} 
            borderRadius="xl" 
            bg={cardBgColor} 
            boxShadow="xl"
            textAlign="center"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Icon as={InfoIcon} boxSize={16} color="red.500" mb={4} />
            <Heading size="lg" mb={4}>Colección no válida</Heading>
            <Text fontSize="lg" mb={6}>La dirección del contrato proporcionada no es válida.</Text>
            <Button 
              colorScheme="blue" 
              size="lg"
              onClick={() => navigate('/comunidad')}
              leftIcon={<Icon as={ExternalLinkIcon} />}
            >
              Volver a Comunidad
            </Button>
          </Box>
        </AnimatedCard>
      </Container>
    );
  }

  if (collectionLoading || loading) {
    return (
      <Container maxW="container.xl" py={12} centerContent>
        <AnimatedCard>
          <VStack spacing={8}>
            <Spinner size="xl" thickness="4px" color={accentColor} speed="0.65s" />
            <Heading size="md" color={textColor}>
              {collectionLoading ? 'Cargando información de la colección...' : 'Cargando NFTs disponibles...'}
            </Heading>
            <Progress size="xs" isIndeterminate width="300px" colorScheme="blue" />
          </VStack>
        </AnimatedCard>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={12}>
        <AnimatedCard>
          <VStack spacing={6} align="stretch">
            {collectionInfo && (
              <Box textAlign="center" mb={8}>
                <Heading size="2xl" mb={4}>{collectionInfo.name}</Heading>
                <Text fontSize="xl" maxW="2xl" mx="auto">
                  {collectionInfo.description}
                </Text>
              </Box>
            )}
            
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="lg"
              p={6}
              bg="red.50"
              borderWidth="1px"
              borderColor="red.200"
            >
              <AlertIcon boxSize="40px" mr={0} color="red.500" />
              <AlertTitle mt={4} mb={2} fontSize="lg">
                Error al cargar los NFTs
              </AlertTitle>
              <AlertDescription maxWidth="lg" fontSize="md">
                {error}
              </AlertDescription>
              <Button 
                mt={6}
                colorScheme="red" 
                onClick={loadAvailableNFTs}
                leftIcon={<Icon as={FaRegClock} />}
              >
                Intentar de nuevo
              </Button>
            </Alert>
          </VStack>
        </AnimatedCard>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero Section con información de la colección */}
      <Box 
        bg={useColorModeValue('blue.50', 'gray.900')} 
        pt={20} 
        pb={16}
        backgroundImage="linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)"
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={10} alignItems="center">
            <GridItem>
              <AnimatedCard>
                <VStack align="flex-start" spacing={5}>
                  <Heading 
                    as="h1" 
                    size="2xl" 
                    color={useColorModeValue('gray.800', 'white')}
                    lineHeight="1.2"
                    fontFamily="heading"
                    bgGradient="linear(to-r, brand.primary, brand.accent3)"
                    bgClip="text"
                    letterSpacing="-1px"
                  >
                    {collectionInfo?.name || "Nani Boronat NFT"}
                  </Heading>
                  
                  <Text 
                    fontSize="lg" 
                    color={useColorModeValue('gray.600', 'gray.300')}
                    maxW="container.md"
                    lineHeight="1.6"
                  >
                    {collectionInfo?.description || "Colección oficial de NFTs de Nani Boronat. Estos NFTs están diseñados por Nani Boronat y representan obras de arte únicas y exclusivas."}
                  </Text>
                  
                  <HStack spacing={10} mt={2} mb={4}>
                    <Box>
                      <Text color="gray.500" fontWeight="medium" mb={1}>Precio</Text>
                      {minNftPricePol !== null && !loadingPol && polEur !== null ? (
                        <>
                          <Text color="green.600" fontSize="3xl" fontWeight="bold" lineHeight="1">
                            {minNftPricePol} POL ≈
                          </Text>
                          <Text color="green.600" fontSize="3xl" fontWeight="bold" lineHeight="1">
                         {(minNftPricePol * polEur).toFixed(2)} €
                          </Text>
                        </>
                      ) : (
                        <Text color="gray.500" fontSize="xl">Cargando precio...</Text>
                      ) }
                    </Box>
                    
                    <Box>
                      <Text color="gray.500" fontWeight="medium" mb={1}>Disponibles</Text>
                      <Text fontSize="3xl" fontWeight="bold" lineHeight="1">{availableNFTs.length}</Text>
                      <Text color="gray.500" fontSize="sm">NFTs únicos</Text>
                    </Box>
                  </HStack>
                  
                  {!account ? (
                    <Button 
                      size="lg"
                      bg="brand.accent4"
                      color="brand.accent3"
                      mt={2}
                      onClick={connectWallet}
                      isLoading={connectingWallet}
                      loadingText="Conectando..."
                      leftIcon={<Icon as={FaWallet} />}
                      fontWeight="bold"
                      fontFamily="heading"
                      height="60px"
                      borderRadius="md"
                      fontSize="lg"
                      _hover={{ bg: "brand.accent3", color: "brand.accent4" }}
                      transition="all 0.2s"
                    >
                      Conectar Wallet
                    </Button>
                  ) : (
                    <HStack mt={2} spacing={4}>
                      <Button 
                        bg="brand.accent2"
                        color="brand.accent3"
                        leftIcon={<Icon as={FaCheck} />}
                        variant="solid"
                        fontFamily="heading"
                        fontSize="lg"
                        fontWeight="bold"
                        height="60px"
                        borderRadius="md"
                        onClick={disconnectWallet}
                        _hover={{ bg: "brand.accent3", color: "brand.accent2" }}
                      >
                        Desconectar Wallet
                      </Button>
                      <Button 
                        bg="brand.accent1"
                        color="brand.primary"
                        fontFamily="heading"
                        fontSize="lg"
                        fontWeight="bold"
                        height="60px"
                        _hover={{ bg: "brand.primary", color: "brand.accent1" }}
                        onClick={() => navigate('/comunidad')}
                        borderRadius="md"
                      >
                        Volver a Comunidad
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </AnimatedCard>
            </GridItem>
            
            <GridItem>
              <AnimatedCard>
                <Box
                  borderRadius="2xl"
                  overflow="hidden"
                  boxShadow="2xl"
                  position="relative"
                  height="350px"
                  border="1px solid"
                  borderColor={useColorModeValue('gray.200', 'gray.700')}
                >
                  <Image
                    src={collectionInfo?.image || "https://via.placeholder.com/800x600?text=Colección+NFT"}
                    alt={collectionInfo?.name || "Colección NFT"}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    bgGradient="linear(to-t, blackAlpha.700, transparent)"
                    p={6}
                    color="white"
                  >
                    <Heading size="md">Colección Verificada</Heading>
                    <HStack mt={2}>
                      <Icon as={CheckCircleIcon} color="green.400" />
                      <Text>Arte Digital Exclusivo</Text>
                    </HStack>
                  </Box>
                </Box>
              </AnimatedCard>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Sección de NFTs disponibles */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
          {groupedNFTs.map((group) => (
            <AnimatedCard key={group.baseType}>
              <Card 
                overflow="hidden"
                variant="outline"
                borderColor={borderColor}
                bg={cardBgColor}
                borderRadius="lg"
                boxShadow="lg"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                  borderColor: accentColor,
                }}
                transition="all 0.3s ease"
                height="100%"
              >
                <Box position="relative">
                  {loadingMetadata && !group.metadata ? (
                    <Skeleton height="300px" />
                  ) : (
                    <Image
                      src={group.metadata?.displayImage || group.metadata?.image || '/placeholder-nft.png'}
                      alt={group.baseType}
                      height="300px"
                      width="100%"
                      objectFit="cover"
                      fallback={<Box bg="gray.100" height="300px" />}
                    />
                  )}
                  <Badge 
                    position="absolute" 
                    top={4} 
                    right={4} 
                    colorScheme={group.nfts.length <= 3 ? "red" : "blue"}
                    fontSize="sm"
                    py={1}
                    px={3}
                    borderRadius="full"
                    boxShadow="md"
                    display="flex"
                    alignItems="center"
                  >
                    <Icon as={FaRegClock} mr={1} />
                    {group.nfts.length <= 3 
                      ? `¡Solo quedan ${group.nfts.length}!` 
                      : `Quedan ${group.nfts.length}`
                    }
                  </Badge>
                </Box>
                
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Heading size="md" isTruncated>
                      {loadingMetadata && !group.metadata ? (
                        <Skeleton height="24px" width="80%" />
                      ) : (
                        group.baseType
                      )}
                    </Heading>
                    
                    <HStack>
                      <Box 
                        bg={highlightBg} 
                        px={3} 
                        py={1} 
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                      >
                        <Icon as={FaWallet} mr={1} />
                        <Text fontWeight="bold">{group.price} POL</Text>
                      </Box>
                      
                      <Box 
                        bg={priceBg} 
                        px={3} 
                        py={1} 
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        color={priceColor}
                      >
                        <Text fontWeight="bold">
                          {polEur && group.price ? `${(Number(group.price) * polEur).toFixed(2)} €` : '...'}
                        </Text>
                      </Box>
                    </HStack>
                    
                    {loadingMetadata && !group.metadata ? (
                      <Skeleton height="60px" width="100%" />
                    ) : (
                      <Text 
                        noOfLines={3}
                        color={secondaryTextColor}
                        fontSize="sm"
                      >
                        {group.metadata?.description || 'Este NFT único representa una pieza digital exclusiva con certificado de autenticidad en la blockchain.'}
                      </Text>
                    )}
                  </VStack>
                </CardBody>
                
                <Divider borderColor={borderColor} />
                
                <CardFooter>
  {!account && (
    <Button 
      bg="brand.accent4"
      color="brand.accent3"
      width="full"
      onClick={connectWallet}
      leftIcon={<Icon as={FaWallet} />}
      borderRadius="md"
      fontFamily="heading"
      height="56px"
      fontSize="lg"
      _hover={{ bg: "brand.accent3", color: "brand.accent4" }}
    >
      Conectar Wallet
    </Button>
  )}
  {account && (
    <Button 
      bg="brand.accent1"
      color="brand.primary"
      width="full"
      onClick={() => handleGroupBuyClick(group)}
      isDisabled={group.nfts.length === 0}
      leftIcon={<Icon as={FaWallet} />}
      _hover={{ bg: "brand.primary", color: "brand.accent1" }}
      fontFamily="heading"
      fontSize="lg"
      height="56px"
      borderRadius="md"
      transition="all 0.2s"
    >
      Comprar NFT
    </Button>
  )}
</CardFooter>
              </Card>
            </AnimatedCard>
          ))}
        </SimpleGrid>
        
        {groupedNFTs.length === 0 && (
          <Center py={16}>
            <VStack spacing={4}>
              <Icon as={InfoIcon} boxSize={12} color="gray.400" />
              <Heading size="md" color={secondaryTextColor}>No hay NFTs disponibles</Heading>
              <Text>Todos los NFTs de esta colección han sido adquiridos.</Text>
            </VStack>
          </Center>
        )}
      </Container>

      {/* Modal de selección de método de pago */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl" boxShadow="2xl">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
            <Heading size="lg">Comprar NFT</Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedNFT && selectedGroup && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={6} align="start">
                  <Box width="50%" borderRadius="lg" overflow="hidden" boxShadow="md">
                    <Image
                      src={selectedNFT.metadata?.displayImage || selectedNFT.metadata?.image || '/placeholder-nft.png'}
                      alt={selectedNFT.metadata?.name || selectedNFT.lazyId}
                      borderRadius="md"
                      fallback={<Box bg="gray.100" height="250px" />}
                    />
                  </Box>
                  
                  <VStack spacing={4} align="start" width="50%">
                    <Heading size="md">
                      {selectedGroup.baseType}
                    </Heading>
                    
                    <Badge colorScheme="blue" fontSize="sm" py={1} px={3} borderRadius="full">
                      {selectedGroup.nfts.length} disponibles
                    </Badge>
                    
                    <Text color={secondaryTextColor} fontSize="sm">
                      {selectedNFT.metadata?.description || 'Este NFT único representa una pieza digital exclusiva con certificado de autenticidad.'}
                    </Text>
                    
                    <Box py={2} px={4} bg={priceBg} borderRadius="md" width="full">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Precio:</Text>
                        <Text fontWeight="bold" color={priceColor}>
                          {selectedNFT && polEur ? `${selectedNFT.price} POL ≈ ${(Number(selectedNFT.price) * polEur).toFixed(2)} €` : '...'}
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </HStack>
                
                <Divider my={2} />
                
                <Box>
                  <Heading size="md" mb={4}>Selecciona método de pago:</Heading>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Button 
                      height="100px"
                      bg="brand.accent1" 
                      color="brand.primary"
                      onClick={handleCryptoPurchase}
                      isLoading={mintingStatus === 'loading'}
                      isDisabled={!account || mintingStatus === 'loading'}
                      _hover={{ bg: "brand.primary", color: "brand.accent1" }}
                      transition="all 0.2s"
                      borderRadius="md"
                      fontFamily="heading"
                    >
                      <VStack>
                        <Icon as={FaEthereum} boxSize={8} />
                        <Text fontFamily="heading" fontWeight="bold">Pagar con Crypto</Text>
                      </VStack>
                    </Button>
                    
                    <Button 
                      height="100px"
                      bg="brand.accent4" 
                      color="brand.accent3"
                      onClick={handleCardPurchase}
                      isDisabled={mintingStatus === 'loading'}
                      _hover={{ bg: "brand.accent3", color: "brand.accent4" }}
                      transition="all 0.2s"
                      borderRadius="md"
                      fontFamily="heading"
                    >
                      <VStack>
                        <Icon as={FaCreditCard} boxSize={8} />
                        <Text fontFamily="heading" fontWeight="bold">Pagar con Tarjeta</Text>
                      </VStack>
                    </Button>
                  </SimpleGrid>
                  
                  {!account && (
                    <Alert status="warning" mt={4} borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Necesitas conectar tu wallet para pagar con crypto
                      </Text>
                    </Alert>
                  )}
                </Box>
                
                {mintingStatus === 'success' && (
                  <Alert status="success" variant="subtle" borderRadius="md" mt={2}>
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <AlertTitle>¡NFT minteado con éxito!</AlertTitle>
                      <AlertDescription>Pronto aparecerá en tu wallet.</AlertDescription>
                    </VStack>
                  </Alert>
                )}
                
                {mintingStatus === 'error' && (
                  <Alert status="error" variant="subtle" borderRadius="md" mt={2}>
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <AlertTitle>Error al mintear el NFT</AlertTitle>
                      <AlertDescription>Por favor, intenta de nuevo.</AlertDescription>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de pago con tarjeta */}
      <Modal isOpen={isPurchaseOpen} onClose={onPurchaseClose} size="md">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="md">Pago con Tarjeta</Heading>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            {selectedNFT && selectedGroup && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={4}>
                  <Image
                    src={selectedNFT.metadata?.displayImage || selectedNFT.metadata?.image || '/placeholder-nft.png'}
                    alt={selectedGroup.baseType}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                    fallback={<Box bg="gray.100" boxSize="100px" />}
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">
                      {selectedGroup.baseType}
                    </Text>
                    <Badge colorScheme="blue">
                      {selectedGroup.nfts.length} disponibles
                    </Badge>
                    <HStack>
                      <Text fontWeight="bold">Precio:</Text>
                      <Text fontWeight="bold" color={priceColor}>
                        {selectedNFT && polEur ? `${(Number(selectedNFT.price) * polEur).toFixed(2)} €` : '...'}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg={useColorModeValue('white', 'whiteAlpha.100')}
                    borderColor={borderColor}
                  />
                </FormControl>
                
                <Text fontSize="sm" color={secondaryTextColor}>
                  Recibirás actualizaciones sobre tu compra en este email.
                  El NFT se minteará automáticamente para ti después del pago.
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onPurchaseClose}
              fontFamily="heading"
              height="56px"
            >
              Cancelar
            </Button>
            <Button 
              bg="brand.accent4" 
              color="brand.accent3"
              onClick={handleStripePurchase} 
              isLoading={mintingStatus === 'loading'}
              loadingText="Procesando..."
              leftIcon={<Icon as={FaCreditCard} />}
              _hover={{ bg: "brand.accent3", color: "brand.accent4" }}
              borderRadius="md"
              fontFamily="heading"
              fontWeight="bold"
              height="56px"
            >
              Proceder al Pago
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CollectionMintPage;