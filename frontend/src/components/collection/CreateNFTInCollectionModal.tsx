import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Image,
  Text,
  Badge,
  VStack,
  Textarea,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightElement,
  Icon,
  Progress
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { CollectionInfo, createNFTInCollection } from '../../utils/collectionContract';
import { DEBUG_LOGS, ADMIN_ADDRESS } from '../nft/types';
import { uploadImageToIPFS, uploadNFTMetadataToIPFS, getIPFSUrl } from '../../utils/ipfs';
import { FiUpload } from 'react-icons/fi';

interface CreateNFTInCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  collection: CollectionInfo | null;
  onSuccess: () => void;
}

const CreateNFTInCollectionModal: React.FC<CreateNFTInCollectionModalProps> = ({
  isOpen,
  onClose,
  account,
  collection,
  onSuccess
}) => {
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [nftPrice, setNftPrice] = useState('');
  const [nftQuantity, setNftQuantity] = useState(1);
  const [creatingNft, setCreatingNft] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    if (account) {
      setIsAdmin(account.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    }
  }, [account]);

  // Crear URL de vista previa cuando se selecciona un archivo
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setImageFile(file);
    }
  }, [toast]);

  // Función para crear un nuevo NFT en la colección
  const handleCreateNFT = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Error",
          description: "Solo los administradores pueden crear NFTs",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!nftName || !nftDescription || !imageFile || !nftPrice || !collection) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      if (!account) {
        toast({
          title: "Error",
          description: "Necesitas conectar tu wallet primero",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setCreatingNft(true);
      setIsUploading(true);
      setUploadProgress(10);
      
      try {
        // Subir imagen a IPFS
        const pinataConfig = {
          apiKey: "4d66b49c3f187e03126c",
          apiSecret: "de0b8ff6bd85a8647c7d41d7e93d613ee6501f06bb12fcd3b9449bdd033bf80c"
        };
        
        const imageCID = await uploadImageToIPFS(
          imageFile, 
          pinataConfig, 
          (progress) => setUploadProgress(Math.min(50, progress / 2))
        );
        setUploadProgress(50);
        
        // Preparamos el metadata del NFT
        const metadata = {
          name: nftName,
          description: nftDescription,
          image: imageCID
        };
        
        setUploadProgress(70);
        
        // Subir metadata a IPFS
        const metadataCID = await uploadNFTMetadataToIPFS(metadata);
        const tokenURI = `ipfs://${metadataCID}`;
        
        setIsUploading(false);
        setUploadProgress(100);
        
        if (DEBUG_LOGS) console.log('Creando NFT con metadata:', metadata);
        
        // Conectamos al proveedor para firmar la transacción
        const { ethereum } = window as any;
        if (!ethereum) {
          toast({
            title: "Error",
            description: "Necesitas tener MetaMask instalado",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setCreatingNft(false);
          return;
        }
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        
        // Crear múltiples NFTs según la cantidad especificada
        let successCount = 0;
        const totalToCreate = nftQuantity;
        
        for (let i = 0; i < totalToCreate; i++) {
          try {
            // Llamar a la función para crear el NFT en la colección
            const result = await createNFTInCollection(
              collection.collectionAddress,
              account,
              tokenURI,
              nftPrice,
              signer
            );
            
            if (result.success) {
              successCount++;
            } else {
              console.error(`Error al crear NFT ${i+1}:`, result.error);
            }
          } catch (err) {
            console.error(`Error al crear NFT ${i+1}:`, err);
          }
        }
        
        if (successCount > 0) {
          toast({
            title: "NFTs creados",
            description: `Se han creado ${successCount} de ${totalToCreate} NFTs "${nftName}" en la colección "${collection.name}"`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          
          // Limpiar el formulario y cerrar el modal
          setNftName('');
          setNftDescription('');
          setImageFile(null);
          setPreviewUrl('');
          setNftPrice('');
          setNftQuantity(1);
          onClose();
          
          // Llamar a la función de éxito para recargar los NFTs
          onSuccess();
        } else {
          toast({
            title: "Error",
            description: `No se pudo crear ningún NFT`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error: any) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error creando NFT:", error);
      toast({
        title: "Error",
        description: `Ocurrió un error al crear el NFT: ${error.message || 'Error desconocido'}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreatingNft(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Crear nuevo NFT
          {collection && (
            <Badge colorScheme="purple" ml={2}>
              Colección: {collection.name}
            </Badge>
          )}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nombre del NFT</FormLabel>
              <Input 
                placeholder="Ej. Arte Digital #1" 
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Descripción</FormLabel>
              <Textarea 
                placeholder="Describe tu NFT..." 
                value={nftDescription}
                onChange={(e) => setNftDescription(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Imagen del NFT</FormLabel>
              <InputGroup>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="nft-image"
                />
                <Input
                  placeholder="Selecciona una imagen..."
                  value={imageFile?.name || ''}
                  isReadOnly
                  onClick={() => document.getElementById('nft-image')?.click()}
                  cursor="pointer"
                />
                <InputRightElement>
                  <Icon as={FiUpload} />
                </InputRightElement>
              </InputGroup>
              <Text fontSize="sm" color="gray.500" mt={1}>
                La imagen se subirá automáticamente a IPFS
              </Text>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Precio (en MATIC)</FormLabel>
              <Input 
                placeholder="0.1" 
                value={nftPrice}
                onChange={(e) => setNftPrice(e.target.value)}
                type="number"
                step="0.01"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Cantidad de NFTs a crear</FormLabel>
              <NumberInput 
                defaultValue={1} 
                min={1} 
                max={10}
                value={nftQuantity}
                onChange={(valueString) => setNftQuantity(Number(valueString))}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Máximo 10 NFTs a la vez
              </Text>
            </FormControl>
            
            {isUploading && (
              <Box width="100%">
                <Text mb={2}>Subiendo a IPFS...</Text>
                <Progress value={uploadProgress} size="sm" colorScheme="blue" />
              </Box>
            )}
            
            {previewUrl && (
              <Box mt={4} mb={4} borderWidth="1px" borderRadius="lg" overflow="hidden" width="100%">
                <Text fontWeight="bold" mb={2}>Vista previa</Text>
                <Image 
                  src={previewUrl} 
                  alt="Vista previa del NFT" 
                  maxH="200px" 
                  mx="auto" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/300?text=Vista+Previa+No+Disponible';
                  }} 
                />
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleCreateNFT} 
            isLoading={creatingNft}
            loadingText={isUploading ? "Subiendo a IPFS..." : "Creando..."}
            isDisabled={!collection || !isAdmin || !imageFile}
          >
            {nftQuantity > 1 ? `Crear ${nftQuantity} NFTs` : 'Crear NFT'}
          </Button>
          <Button variant="ghost" onClick={onClose} isDisabled={creatingNft}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateNFTInCollectionModal;
