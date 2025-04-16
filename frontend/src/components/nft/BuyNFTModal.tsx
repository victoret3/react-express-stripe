import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Image,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  FormControl,
  FormLabel,
  Link,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import { buyNFT } from '../../utils/nftContract';
import { NFT, getEurPrice } from './types';

interface BuyNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNft: NFT | null;
  account: string | null;
  onConnect: () => Promise<void>;
}

const BuyNFTModal: React.FC<BuyNFTModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedNft, 
  account,
  onConnect
}) => {
  const [email, setEmail] = useState('');
  const [buyingWithCrypto, setBuyingWithCrypto] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const toast = useToast();

  // Función para comprar con tarjeta de crédito
  const handleCreditCardPurchase = async () => {
    if (!selectedNft || !email) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      // Aquí se implementaría la lógica de pago con Stripe
      // Simular la compra por ahora
      toast({
        title: "Procesando pago",
        description: "Redirigiendo a la pasarela de pago...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      // Simular redirección a Stripe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "¡Compra exitosa!",
        description: "Un email de confirmación ha sido enviado a tu correo.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error("Error en el pago con tarjeta:", error);
      toast({
        title: "Error en el pago",
        description: "No se pudo completar el pago. Intenta de nuevo más tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Función para comprar con criptomonedas
  const handleCryptoPurchase = async () => {
    try {
      if (!selectedNft || !account) {
        toast({
          title: "Error",
          description: "Necesitas conectar tu wallet primero",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setBuyingWithCrypto(true);
      
      // Conectarnos a la blockchain
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "Error",
          description: "Necesitas tener Metamask instalado",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setBuyingWithCrypto(false);
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      
      // Llamar a la función del contrato
      const result = await buyNFT(
        selectedNft.tokenId,
        selectedNft.price,
        signer
      );
      
      if (result.success) {
        setTxHash(result.transactionHash);
        
        toast({
          title: "¡Compra exitosa!",
          description: "Has adquirido el NFT correctamente. Revisa tu wallet.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error en la transacción",
          description: result.error || "No se pudo completar la compra con MATIC.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error en la compra con crypto:', error);
      toast({
        title: "Error en la transacción",
        description: error.message || "No se pudo completar la compra con MATIC.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBuyingWithCrypto(false);
    }
  };

  if (!selectedNft) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Comprar NFT</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="center">
            <Image 
              src={selectedNft.image} 
              alt={selectedNft.name} 
              borderRadius="lg" 
              maxHeight="300px" 
              mx="auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/300?text=NFT+Image';
              }}
            />
            <Box textAlign="center">
              <Heading size="md" mb={2}>{selectedNft.name}</Heading>
              <Text mb={2}>{selectedNft.description}</Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.500" mb={4}>
                {selectedNft.price} MATIC / ~{getEurPrice(selectedNft.price)}€
              </Text>
            </Box>
            
            <Tabs isFitted variant="enclosed" width="100%">
              <TabList mb="1em">
                <Tab>Pago con MATIC</Tab>
                <Tab>Pago con Tarjeta</Tab>
              </TabList>
              <TabPanels>
                {/* Opción de pago con crypto */}
                <TabPanel>
                  <VStack spacing={4}>
                    {!account ? (
                      <>
                        <Text>Conecta tu wallet para pagar con MATIC</Text>
                        <Button colorScheme="blue" onClick={onConnect}>
                          Conectar Wallet
                        </Button>
                      </>
                    ) : txHash ? (
                      <>
                        <Text color="green.500" fontWeight="bold">¡Compra exitosa!</Text>
                        <Link 
                          href={`https://polygonscan.com/tx/${txHash}`} 
                          isExternal 
                          color="blue.500"
                        >
                          Ver transacción <ExternalLinkIcon mx="2px" />
                        </Link>
                        <Button colorScheme="green" onClick={onClose}>
                          Cerrar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Text>Confirma la compra para proceder con el pago</Text>
                        <Button 
                          colorScheme="blue" 
                          onClick={handleCryptoPurchase}
                          isLoading={buyingWithCrypto}
                          loadingText="Procesando..."
                          width="100%"
                        >
                          Confirmar compra
                        </Button>
                      </>
                    )}
                  </VStack>
                </TabPanel>

                {/* Opción de pago con tarjeta */}
                <TabPanel>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Email para recibir la confirmación</FormLabel>
                      <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl>
                    <Button 
                      colorScheme="green" 
                      width="100%"
                      onClick={handleCreditCardPurchase}
                    >
                      Pagar {getEurPrice(selectedNft.price)}€ con tarjeta
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuyNFTModal;
