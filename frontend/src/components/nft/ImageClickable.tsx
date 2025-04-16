import React from 'react';
import { Box, Image } from '@chakra-ui/react';

interface ImageClickableProps {
  src: string;
  alt: string;
  onClick: () => void;
  height?: string;
}

const ImageClickable: React.FC<ImageClickableProps> = ({ 
  src, 
  alt, 
  onClick,
  height = "250px" 
}) => {
  return (
    <Box 
      onClick={onClick}
      cursor="pointer"
      position="relative"
      height={height}
      _after={{
        content: '"🔍"',
        position: "absolute",
        top: "10px",
        right: "10px",
        bg: "whiteAlpha.700",
        color: "gray.800",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0,
        transition: "opacity 0.3s"
      }}
      _hover={{
        _after: {
          opacity: 1
        }
      }}
    >
      <Image 
        src={src} 
        alt={alt} 
        width="100%" 
        height="100%" 
        objectFit="cover"
      />
    </Box>
  );
};

export default ImageClickable;
