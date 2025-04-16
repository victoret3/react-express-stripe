import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spacer,
  Text,
  useToast,
  Center,
  VStack,
  Spinner
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

// Importar componentes modulares
import CollectionGallery from '../components/collection/CollectionGallery';
import CreateCollectionModal from '../components/collection/CreateCollectionModal';
import CreateNFTInCollectionModal from '../components/collection/CreateNFTInCollectionModal';
import { ADMIN_ADDRESS } from '../components/nft/types';

// Importar funciones del contrato
import { 
  CollectionInfo, 
  getAllCollections, 
  getCollectionsByOwner 
} from '../utils/collectionContract';
import { COLLECTION_FACTORY_ADDRESS } from '../utils/contracts';

// Importar configuración de red
import { NETWORK_RPC_URL, switchToCorrectNetwork } from '../config/network';
import { Collection } from '../types/Collection';

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [myCollections, setMyCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  const {
    isOpen: isCreateCollectionOpen,
    onOpen: onCreateCollectionOpen,
    onClose: onCreateCollectionClose
  } = useDisclosure();
  
  const {
    isOpen: isCreateNFTOpen,
    onOpen: onCreateNFTOpen,
    onClose: onCreateNFTClose
  } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();

  // Función para conectar wallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "Error",
          description: "Por favor instala MetaMask para usar esta aplicación",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await switchToCorrectNetwork();
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = accounts[0];
      setAccount(currentAccount);
      setIsAdmin(currentAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
      
      // Recargar colecciones después de conectar
      await fetchCollections(currentAccount);
    } catch (error) {
      console.error("Error conectando wallet:", error);
      toast({
        title: "Error",
        description: "No se pudo conectar la wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { ethereum } = window as any;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          
          // Verificar si el usuario tiene cuenta conectada
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAccount(currentAccount);
            setIsAdmin(currentAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
            await fetchCollections(currentAccount);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        setLoading(false);
      }
    };
    
    checkConnection();
    
    // Escuchar cambios en la cuenta
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setAccount(currentAccount);
          setIsAdmin(currentAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
          fetchCollections(currentAccount);
        } else {
          setAccount(null);
          setIsAdmin(false);
        }
      });
    }
    
    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const fetchCollections = async (currentAccount?: string) => {
    try {
      setLoading(true);
      
      const { ethereum } = window as any;
      let provider;
      
      try {
        // Primera opción: usar MetaMask si está disponible
        if (ethereum) {
          provider = new ethers.providers.Web3Provider(ethereum);
          const network = await provider.getNetwork();
          console.log('Red actual (MetaMask):', network);
  
          if (network.chainId !== 421614) { // Arbitrum Sepolia
            try {
              await switchToCorrectNetwork();
              // Intentar actualizar el provider después del cambio de red
              provider = new ethers.providers.Web3Provider(ethereum);
            } catch (networkError) {
              console.warn('No se pudo cambiar de red, usando provider fallback:', networkError);
              // Si falla el cambio de red, usar un provider directo
              provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
            }
          }
        } else {
          // Segunda opción: usar provider directo
          console.log('MetaMask no disponible, usando provider RPC directo');
          provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
        }
      } catch (providerError) {
        // Tercer opción (fallback): si todo falla, usar un provider directo
        console.error('Error al configurar provider, usando fallback:', providerError);
        provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
      }
      
      // Verificar que tenemos un provider funcionando
      try {
        const network = await provider.getNetwork();
        console.log('Provider configurado correctamente. Red:', network.name, network.chainId);
      } catch (networkTestError) {
        console.error('El provider no funciona correctamente:', networkTestError);
        throw new Error('No se pudo conectar a la red blockchain');
      }
      
      // Obtener todas las colecciones
      console.log('Intentando obtener colecciones del contrato:', COLLECTION_FACTORY_ADDRESS);
      const rawCollections = await getAllCollections(provider);
      console.log('Número de colecciones obtenidas:', rawCollections.length);
      
      const allCollections: Collection[] = rawCollections.map((col: CollectionInfo) => ({
        ...col,
        image: col.imageCid || '',
        address: col.collectionAddress,
      }));
      
      console.log('Colecciones formateadas:', allCollections);
      setCollections(allCollections);
      
      // Si hay una cuenta conectada, obtener sus colecciones
      if (currentAccount || account) {
        console.log('Obteniendo colecciones para la cuenta:', currentAccount || account);
        try {
          const rawUserCollections = await getCollectionsByOwner(currentAccount || account || '', provider);
          console.log('Colecciones obtenidas para el usuario:', rawUserCollections.length);
          
          const userCollections: Collection[] = rawUserCollections.map((col: CollectionInfo) => ({
            ...col,
            image: col.imageCid || '',
            address: col.collectionAddress,
          }));
          
          console.log('Colecciones del usuario formateadas:', userCollections);
          setMyCollections(userCollections);
        } catch (userCollectionsError) {
          console.error('Error obteniendo colecciones del usuario:', userCollectionsError);
          toast({
            title: "Advertencia",
            description: "No se pudieron cargar tus colecciones personales",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error("Error obteniendo colecciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las colecciones. Intenta recargar la página",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNFT = (collection: Collection) => {
    if (!account) {
      toast({
        title: "Error",
        description: "Por favor conecta tu wallet primero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setSelectedCollection(collection);
    onCreateNFTOpen();
  };

  return (
    <Container maxW="container.xl" py={24}>
      <Flex mb={8} align="center">
        <Box>
          <Heading size="lg">Colección de NFTs</Heading>
          <Text mt={2}>Explora y adquiere NFTs exclusivos de Nani Boronat</Text>
        </Box>
        <Spacer />
          {!account ? (
          <Button
            colorScheme="blue"
            onClick={connectWallet}
          >
              Conectar Wallet
            </Button>
          ) : (
          <Flex align="center" gap={4}>
            <Text fontSize="sm" color="gray.600">
              {`${account.substring(0, 6)}...${account.substring(38)}`}
            </Text>
              {isAdmin && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="green"
                onClick={onCreateCollectionOpen}
              >
                  Crear Colección
                </Button>
              )}
            </Flex>
          )}
      </Flex>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Todos los NFTs</Tab>
          {account && <Tab>Mis NFTs</Tab>}
        </TabList>

        <TabPanels>
          <TabPanel>
            {loading ? (
              <Center py={10}>
                <Text>Cargando colecciones...</Text>
              </Center>
            ) : (
              <CollectionGallery
                collections={collections.map(col => ({
                  ...col,
                  imageCid: col.image,
                  collectionAddress: col.address
                }))}
                onSelectCollection={collection => handleCreateNFT({
                  ...collection,
                  image: collection.imageCid,
                  address: collection.collectionAddress
                })}
                isAdmin={isAdmin}
              />
            )}
          </TabPanel>

          {account && (
            <TabPanel>
              {loading ? (
                <Center py={10}>
                  <Text>Cargando tus colecciones...</Text>
                </Center>
              ) : (
                <CollectionGallery
                  collections={myCollections.map(col => ({
                    ...col,
                    imageCid: col.image,
                    collectionAddress: col.address
                  }))}
                  onSelectCollection={collection => handleCreateNFT({
                    ...collection,
                    image: collection.imageCid,
                    address: collection.collectionAddress
                  })}
                  isAdmin={isAdmin}
                />
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <CreateCollectionModal
        isOpen={isCreateCollectionOpen}
        onClose={onCreateCollectionClose}
        account={account}
        onSuccess={() => fetchCollections()}
      />

      <CreateNFTInCollectionModal
        isOpen={isCreateNFTOpen}
        onClose={onCreateNFTClose}
        account={account}
        collection={selectedCollection ? {
          ...selectedCollection,
          imageCid: selectedCollection.image,
          collectionAddress: selectedCollection.address
        } : null}
        onSuccess={() => fetchCollections()}
      />
    </Container>
  );
};

export default Collections;