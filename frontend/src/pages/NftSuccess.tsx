import React, { useState, useEffect } from "react";
import { Box, Heading, Text, Button, VStack, Input, FormControl, FormLabel, useToast, Image, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Link, Container, HStack, Divider, Badge, useColorModeValue } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { CheckCircleIcon, ExternalLinkIcon, WarningIcon } from '@chakra-ui/icons';

interface NftInfo {
  name: string;
  image: string;
  description: string;
  tokenId: string;
  minted: boolean;
  owner: string | null;
  mintedAt: string | null;
}

// Definimos el tipo de estado del NFT
type NFTStatus = {
  nftId: string;
  nftName: string;
  nftImage: string;
  nftDescription: string;
  minted: boolean;
  txHash?: string;
  mintedAt?: string;
  sessionId: string;
  paymentStatus: string;
  loading: boolean;
  error?: string;
};

// Estado inicial del NFT
const initialNFTStatus: NFTStatus = {
  nftId: '',
  nftName: 'Cargando NFT...',
  nftImage: '',
  nftDescription: '',
  minted: false,
  sessionId: '',
  paymentStatus: '',
  loading: true
};

const NftSuccess: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nftInfo, setNftInfo] = useState<NftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Estados para manejar la información del NFT y la wallet
  const [nftStatus, setNFTStatus] = useState<NFTStatus>(initialNFTStatus);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string>('');
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    // Obtener el ID de sesión de la URL
    const params = new URLSearchParams(location.search);
    const session_id = params.get("session_id");
    
    if (session_id) {
      setSessionId(session_id);
      fetchNftStatus(session_id);
    } else {
      setError("No se encontró ID de sesión en la URL");
      setLoading(false);
    }
  }, [location]);
  
  const fetchNftStatus = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/nfts/status/${sessionId}`);
      
      // Verificar si la respuesta contiene datos válidos del NFT
      if (!response.data || !response.data.nft) {
        setError("Tu NFT se está procesando y pronto se minteará en tu wallet. Recibirás una notificación cuando el proceso finalice.");
        return;
      }
      
      // Asegurarnos de que todos los campos requeridos estén presentes
      const nft = {
        ...response.data.nft,
        // Proporcionar valores por defecto para evitar errores
        minted: response.data.nft.minted || false,
        owner: response.data.nft.owner || null,
        mintedAt: response.data.nft.mintedAt || null
      };
      
      // Actualizar el estado con la información completa
      setNftInfo(nft);
      
      // Si ya está minteado, mostrar mensaje de éxito
      if (nft.minted && nft.owner) {
        toast({
          title: "NFT ya reclamado",
          description: `Este NFT ya fue transferido a la wallet ${nft.owner.substring(0, 6)}...${nft.owner.substring(38)}`,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error al obtener estado del NFT:', error);
      setError("Tu NFT se está procesando y pronto se minteará en tu wallet. Recibirás una notificación cuando el proceso finalice.");
    } finally {
      setLoading(false);
    }
  };
  
  const validateWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  const handleClaimNft = async () => {
    if (!walletAddress || !sessionId) {
      toast({
        title: "Error",
        description: "Por favor introduce una dirección de wallet válida.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Validar formato de la dirección wallet
    if (!validateWalletAddress(walletAddress)) {
      toast({
        title: "Dirección inválida",
        description: "Introduce una dirección de wallet válida en formato 0x...",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setClaiming(true);
      const response = await axios.post('/api/nfts/claim', {
        sessionId,
        walletAddress
      });
      
      // Guardar el hash de la transacción
      setTxHash(response.data.txHash);
      
      // Actualizar el estado del NFT
      await fetchNftStatus(sessionId);
      
      toast({
        title: "¡NFT reclamado con éxito!",
        description: "Tu NFT ha sido transferido a tu wallet.",
        status: "success",
        duration: 8000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error al reclamar NFT:', error);
      toast({
        title: "Error al reclamar el NFT",
        description: error.response?.data?.error || "No se pudo transferir el NFT. Inténtalo de nuevo más tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Función para conectar wallet usando Metamask
  const connectWallet = async () => {
    setIsConnecting(true);
    setClaimError('');
    
    try {
      // @ts-ignore - window.ethereum puede no estar definido en el tipo
      if (window.ethereum) {
        try {
          // @ts-ignore
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          const account = accounts[0];
          setWalletAddress(account);
          
          toast({
            title: 'Wallet conectada',
            description: `Conectado a ${account.substring(0, 6)}...${account.substring(38)}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error al conectar wallet:', error);
          setClaimError('No se pudo conectar a la wallet. Por favor, inténtalo de nuevo.');
          
          toast({
            title: 'Error',
            description: 'Error al conectar wallet',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        setClaimError('MetaMask no está instalado. Por favor, instala MetaMask para continuar.');
        
        toast({
          title: 'MetaMask no encontrado',
          description: 'Por favor instala MetaMask y recarga la página',
          status: 'warning',
          duration: 9000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error general al conectar wallet:', error);
      setClaimError('Error inesperado al conectar wallet');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Función para reclamar el NFT
  const claimNFT = async () => {
    setIsClaiming(true);
    setClaimError('');
    
    try {
      if (!walletAddress) {
        setClaimError('Por favor, conecta tu wallet primero');
        setIsClaiming(false);
        return;
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://naniboronat-backend.vercel.app';
      
      const response = await axios.post(`${apiUrl}/api/claim-nft`, {
        sessionId: nftStatus.sessionId,
        walletAddress: walletAddress
      });
      
      console.log('Respuesta de reclamo:', response.data);
      
      if (response.data.error) {
        setClaimError(response.data.error);
        
        toast({
          title: 'Error',
          description: response.data.error,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
        
        return;
      }
      
      setClaimSuccess(true);
      
      // Actualizar el estado del NFT con la información de la transacción
      setNFTStatus({
        ...nftStatus,
        minted: true,
        txHash: response.data.txHash
      });
      
      toast({
        title: '¡NFT Reclamado!',
        description: `Tu NFT ha sido minteado exitosamente.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      
    } catch (error: any) {
      console.error('Error al reclamar NFT:', error);
      
      setClaimError(
        error.response?.data?.error || 
        error.response?.data?.details || 
        'Error al reclamar el NFT. Por favor, inténtalo de nuevo.'
      );
      
      toast({
        title: 'Error',
        description: 'No se pudo reclamar el NFT',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsClaiming(false);
    }
  };
  
  // URL para ver en Etherscan
  const getEtherscanUrl = () => {
    if (!nftStatus.txHash) return '';
    // Ajusta según la red que estés usando (mainnet, testnet, etc.)
    return `https://goerli.etherscan.io/tx/${nftStatus.txHash}`;
  };
  
  if (loading) {
    return (
      <Box padding={8} textAlign="center" maxWidth="600px" margin="0 auto">
        <Heading as="h1" size="xl" mb={4}>
          Cargando...
        </Heading>
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box padding={8} textAlign="center" maxWidth="600px" margin="0 auto" mt={12}>
        <Alert status="info" borderRadius="md" flexDirection="column" alignItems="center" p={6} mb={6}>
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Procesando tu NFT
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
        </Alert>
        <Button colorScheme="blue" onClick={() => navigate('/lazy-mint')}>
          Volver a la colección
        </Button>
      </Box>
    );
  }
  
  // Si el NFT ya ha sido reclamado y tenemos información
  if (nftInfo?.minted && nftInfo?.owner) {
    return (
      <Box padding={8} textAlign="center" maxWidth="600px" margin="0 auto">
        <Heading as="h1" size="xl" mb={4}>
          ¡NFT Reclamado!
        </Heading>
        
        {nftInfo && (
          <Box mb={6}>
            <Image 
              src={nftInfo.image} 
              alt={nftInfo.name} 
              borderRadius="lg" 
              maxHeight="300px" 
              mx="auto"
              mb={4}
            />
            <Heading as="h2" size="md" mb={2}>{nftInfo.name}</Heading>
            <Text mb={4}>{nftInfo.description}</Text>
          </Box>
        )}
        
        <Alert status="success" borderRadius="md" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>NFT transferido con éxito</AlertTitle>
            <AlertDescription>
              Este NFT ya fue transferido a la wallet:<br /> 
              {nftInfo.owner.substring(0, 6)}...{nftInfo.owner.substring(38)}
            </AlertDescription>
          </Box>
        </Alert>
        
        {txHash && (
          <Text fontSize="sm" mb={6}>
            TX Hash: <Link href={`https://polygonscan.com/tx/${txHash}`} isExternal color="blue.500">
              {txHash.substring(0, 10)}...{txHash.substring(58)}
            </Link>
          </Text>
        )}
        
        <Button colorScheme="blue" onClick={() => navigate('/nfts')}>
          Volver a la colección
        </Button>
      </Box>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Encabezado */}
        <Box textAlign="center" mb={6}>
          <Heading as="h1" size="xl" mb={2}>
            Tu NFT está esperando
          </Heading>
          <Text fontSize="lg" color="gray.500">
            Completa el proceso para reclamar tu NFT
          </Text>
        </Box>
        
        {/* Mostrar errores */}
        {(nftStatus.error || claimError) && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Error:</AlertTitle>
            <AlertDescription>{nftStatus.error || claimError}</AlertDescription>
          </Alert>
        )}
        
        {/* Contenido principal */}
        {nftStatus.loading ? (
          <Box textAlign="center" p={10}>
            <Spinner size="xl" />
            <Text mt={4}>Cargando información del NFT...</Text>
          </Box>
        ) : (
          <Box 
            borderWidth="1px" 
            borderRadius="lg" 
            overflow="hidden"
            bg={bgColor}
            borderColor={borderColor}
            shadow="md"
          >
            {/* Información del NFT */}
            <Box p={6}>
              <HStack spacing={8} alignItems="flex-start">
                {/* Imagen */}
                {nftStatus.nftImage && (
                  <Box
                    borderWidth="1px"
                    borderRadius="md"
                    overflow="hidden"
                    width="200px"
                    height="200px"
                  >
                    <Image 
                      src={nftStatus.nftImage} 
                      alt={nftStatus.nftName} 
                      objectFit="cover"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                )}
                
                {/* Detalles */}
                <VStack align="stretch" flex="1">
                  <Heading as="h2" size="md">
                    {nftStatus.nftName}
                    {nftStatus.minted && (
                      <Badge ml={2} colorScheme="green">Minteado</Badge>
                    )}
                  </Heading>
                  
                  <Text fontSize="sm" color="gray.500">
                    Token ID: {nftStatus.nftId}
                  </Text>
                  
                  {nftStatus.nftDescription && (
                    <Text mt={2}>{nftStatus.nftDescription}</Text>
                  )}
                  
                  {/* Estado del pago */}
                  <Box mt={4}>
                    <Text fontWeight="bold">
                      Estado del pago: 
                      <Badge 
                        ml={2} 
                        colorScheme={nftStatus.paymentStatus === 'paid' ? 'green' : 'yellow'}
                      >
                        {nftStatus.paymentStatus === 'paid' ? 'Pagado' : nftStatus.paymentStatus}
                      </Badge>
                    </Text>
                  </Box>
                  
                  {/* Información de transacción si ya está minteado */}
                  {nftStatus.minted && nftStatus.txHash && (
                    <Box mt={2}>
                      <Text fontSize="sm">
                        Transacción: 
                        <Link 
                          href={getEtherscanUrl()} 
                          isExternal
                          color="blue.500"
                          ml={1}
                        >
                          {nftStatus.txHash.substring(0, 10)}...{nftStatus.txHash.substring(56)}
                          <ExternalLinkIcon mx="2px" />
                        </Link>
                      </Text>
                      
                      {nftStatus.mintedAt && (
                        <Text fontSize="sm" color="gray.500">
                          Minteado el {new Date(nftStatus.mintedAt).toLocaleString()}
                        </Text>
                      )}
                    </Box>
                  )}
                </VStack>
              </HStack>
            </Box>
            
            <Divider />
            
            {/* Proceso de reclamo */}
            <Box p={6}>
              {claimSuccess || nftStatus.minted ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon as={CheckCircleIcon} />
                  <Box>
                    <AlertTitle>¡NFT Reclamado con éxito!</AlertTitle>
                    <AlertDescription>
                      Tu NFT ha sido minteado a tu wallet correctamente.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <VStack spacing={4} align="stretch">
                  <Heading as="h3" size="sm">
                    Para reclamar tu NFT:
                  </Heading>
                  
                  <Box>
                    <HStack>
                      <Box 
                        bg={walletAddress ? "green.100" : "gray.100"} 
                        color={walletAddress ? "green.800" : "gray.800"} 
                        borderRadius="full" 
                        p={1} 
                        width="24px" 
                        height="24px" 
                        textAlign="center"
                      >
                        1
                      </Box>
                      <Text fontWeight={walletAddress ? "bold" : "normal"}>
                        Conecta tu wallet
                      </Text>
                    </HStack>
                    
                    {!walletAddress && (
                      <Button
                        onClick={connectWallet}
                        isLoading={isConnecting}
                        loadingText="Conectando..."
                        colorScheme="blue"
                        mt={2}
                        ml={8}
                        size="sm"
                      >
                        Conectar Wallet
                      </Button>
                    )}
                    
                    {walletAddress && (
                      <Text ml={8} fontSize="sm" color="gray.600">
                        Conectado: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                      </Text>
                    )}
                  </Box>
                  
                  <Box>
                    <HStack>
                      <Box 
                        bg={claimSuccess ? "green.100" : "gray.100"} 
                        color={claimSuccess ? "green.800" : "gray.800"} 
                        borderRadius="full" 
                        p={1} 
                        width="24px" 
                        height="24px" 
                        textAlign="center"
                      >
                        2
                      </Box>
                      <Text fontWeight={claimSuccess ? "bold" : "normal"}>
                        Reclama tu NFT
                      </Text>
                    </HStack>
                    
                    {walletAddress && !claimSuccess && (
                      <Button
                        onClick={claimNFT}
                        isLoading={isClaiming}
                        loadingText="Reclamando..."
                        colorScheme="green"
                        mt={2}
                        ml={8}
                        size="sm"
                        isDisabled={!walletAddress || isClaiming}
                      >
                        Reclamar NFT
                      </Button>
                    )}
                  </Box>
                </VStack>
              )}
            </Box>
          </Box>
        )}
        
        {/* Botones de navegación */}
        <Box mt={6}>
          <HStack spacing={4} justify="center">
            <Button
              as="a"
              href="/"
              variant="outline"
            >
              Volver a la tienda
            </Button>
            
            {nftStatus.minted && nftStatus.txHash && (
              <Button
                as="a"
                href={getEtherscanUrl()}
                rightIcon={<ExternalLinkIcon />}
                colorScheme="blue"
                variant="solid"
                target="_blank"
              >
                Ver en Etherscan
              </Button>
            )}
          </HStack>
        </Box>
        
        {/* Info sesión para debug */}
        <Box mt={4} p={4} bg="gray.50" borderRadius="md" fontSize="xs" color="gray.500">
          <Text>Session ID: {nftStatus.sessionId}</Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default NftSuccess;
