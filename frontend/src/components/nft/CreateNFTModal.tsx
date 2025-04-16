import React, { useState } from 'react';
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
  useToast
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { createNFT } from '../../utils/nftContract';
import { ADMIN_ADDRESS, DEBUG_LOGS } from './types';

interface CreateNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string | null;
  onSuccess: () => void;
}

const CreateNFTModal: React.FC<CreateNFTModalProps> = ({ 
  isOpen, 
  onClose, 
  account,
  onSuccess
}) => {
  const [newNftName, setNewNftName] = useState('');
  const [newNftDescription, setNewNftDescription] = useState('');
  const [newNftImage, setNewNftImage] = useState('');
  const [newNftPrice, setNewNftPrice] = useState('');
  const [creatingNft, setCreatingNft] = useState(false);
  
  const toast = useToast();

  // Función para crear un nuevo NFT
  const handleCreateNFT = async () => {
    try {
      if (!newNftName || !newNftDescription || !newNftImage || !newNftPrice) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setCreatingNft(true);
      
      // Conectamos al proveedor para firmar la transacción
      const { ethereum } = window as any;
      if (!ethereum) {
        toast({
          title: "Error",
          description: "Necesitas tener Metamask instalado",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setCreatingNft(false);
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      
      // Preparamos el metadata del NFT
      const metadata = {
        name: newNftName,
        description: newNftDescription,
        image: newNftImage
      };
      
      // En un entorno real, subiríamos este metadata a IPFS
      // Por ahora simulamos una URL de metadata
      const tokenURI = `https://ipfs.io/ipfs/QmSample/${Date.now()}`;  // Esto es solo un placeholder
      
      if (DEBUG_LOGS) console.log('Creando NFT con metadata:', metadata);
      
      // Llamar a la función del contrato para crear el NFT
      const result = await createNFT(
        account || ADMIN_ADDRESS, // Asignar al usuario conectado o al admin por defecto
        tokenURI,
        newNftPrice,
        signer
      );
      
      if (result.success) {
        toast({
          title: "NFT creado",
          description: `NFT creado exitosamente con ID: ${result.tokenId}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Limpiar el formulario y cerrar el modal
        setNewNftName('');
        setNewNftDescription('');
        setNewNftImage('');
        setNewNftPrice('');
        onClose();
        
        // Llamar a la función de éxito para recargar los NFTs
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: `No se pudo crear el NFT: ${result.error || 'Error desconocido'}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
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
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear nuevo NFT</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Nombre del NFT</FormLabel>
            <Input 
              placeholder="Ej. Nani Art #1" 
              value={newNftName}
              onChange={(e) => setNewNftName(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Descripción</FormLabel>
            <Input 
              placeholder="Descripción de tu NFT" 
              value={newNftDescription}
              onChange={(e) => setNewNftDescription(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>URL de la imagen</FormLabel>
            <Input 
              placeholder="https://ejemplo.com/imagen.jpg" 
              value={newNftImage}
              onChange={(e) => setNewNftImage(e.target.value)}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Precio (en MATIC)</FormLabel>
            <Input 
              placeholder="0.1" 
              value={newNftPrice}
              onChange={(e) => setNewNftPrice(e.target.value)}
              type="number"
              step="0.01"
            />
          </FormControl>
          
          {newNftImage && (
            <Box mt={4} mb={4} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <Text fontWeight="bold" mb={2}>Vista previa</Text>
              <Image 
                src={newNftImage} 
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
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleCreateNFT} 
            isLoading={creatingNft}
            loadingText="Creando..."
          >
            Crear NFT
          </Button>
          <Button variant="ghost" onClick={onClose} isDisabled={creatingNft}>Cancelar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateNFTModal;
