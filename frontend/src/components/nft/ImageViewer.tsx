import React from 'react';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalCloseButton, 
  ModalBody, 
  Image
} from '@chakra-ui/react';

interface ImageViewerProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageSrc, isOpen, onClose }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isCentered 
      size="full"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
      <ModalContent bg="transparent" maxW="100vw" maxH="100vh" m="0">
        <ModalCloseButton 
          color="white" 
          bg="blackAlpha.600" 
          borderRadius="full" 
          size="lg" 
          m="10px"
          zIndex={10}
          _hover={{ bg: "blackAlpha.800" }}
        />
        <ModalBody display="flex" alignItems="center" justifyContent="center" p="0">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt="Vista ampliada"
              maxW="95vw"
              maxH="95vh"
              objectFit="contain"
              onClick={onClose}
              cursor="zoom-out"
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageViewer;
