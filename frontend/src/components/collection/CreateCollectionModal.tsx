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
  VStack,
  Textarea,
  Box,
  Image,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  Icon
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { createCollection } from '../../utils/collectionContract';
import { ADMIN_ADDRESS } from '../nft/types';
import { uploadImageToIPFS, getIPFSUrl } from '../../utils/ipfs';
import { FiUpload } from 'react-icons/fi';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  onSuccess: () => void;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  
  const handleCreateCollection = async () => {
    try {
      if (!isAdmin) {
        toast({
          title: "Error",
          description: "Solo los administradores pueden crear colecciones",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!name || !symbol || !description || !imageFile) {
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
      
      setIsCreating(true);
      setIsUploading(true);
      
      try {
        // Configuración de Pinata
        const pinataConfig = {
          apiKey: "4d66b49c3f187e03126c",
          apiSecret: "de0b8ff6bd85a8647c7d41d7e93d613ee6501f06bb12fcd3b9449bdd033bf80c"
        };
        
        // Subir imagen a IPFS
        const imageCID = await uploadImageToIPFS(imageFile, pinataConfig);
        setIsUploading(false);

        const { ethereum } = window as any;
        if (!ethereum) {
          throw new Error("Necesitas tener MetaMask instalado");
        }
        
        // Crear la colección usando el CID de IPFS
        const result = await createCollection(
          name,
          symbol,
          description,
          imageCID
        );
        
        if (result.success) {
          toast({
            title: "Colección creada",
            description: `Colección "${name}" creada exitosamente`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          
          // Limpiar el formulario y cerrar el modal
          setName('');
          setSymbol('');
          setDescription('');
          setImageFile(null);
          setPreviewUrl('');
          onClose();
          
          // Llamar a la función de éxito para recargar las colecciones
          onSuccess();
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (error: any) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error creando colección:", error);
      toast({
        title: "Error",
        description: `Ocurrió un error: ${error.message || 'Error desconocido'}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear nueva colección de NFTs</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nombre de la colección</FormLabel>
              <Input 
                placeholder="Ej. Nani Boronat Art Collection" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Símbolo (3-5 caracteres)</FormLabel>
              <Input 
                placeholder="Ej. NBAC" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                maxLength={5}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Descripción</FormLabel>
              <Textarea 
                placeholder="Describe tu colección..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Imagen de portada</FormLabel>
              <InputGroup>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="collection-image"
                />
                <Input
                  placeholder="Selecciona una imagen..."
                  value={imageFile?.name || ''}
                  isReadOnly
                  onClick={() => document.getElementById('collection-image')?.click()}
                  cursor="pointer"
                />
                <InputRightElement>
                  <Icon as={FiUpload} />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            {previewUrl && (
              <Box mt={4} mb={4} borderWidth="1px" borderRadius="lg" overflow="hidden" width="100%">
                <Text fontWeight="bold" mb={2}>Vista previa</Text>
                <Image 
                  src={previewUrl}
                  alt="Vista previa de la colección" 
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
            onClick={handleCreateCollection} 
            isLoading={isCreating || isUploading}
            loadingText={isUploading ? "Subiendo imagen..." : "Creando..."}
            isDisabled={!isAdmin || !imageFile}
          >
            Crear Colección
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            isDisabled={isCreating || isUploading}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateCollectionModal;
