import React, { useState } from 'react';
import {
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botón de menú hamburguesa */}
      <IconButton
        icon={<HamburgerIcon />}
        position="absolute"
        top="20px"
        right="20px"
        onClick={toggleDrawer}
        aria-label="Abrir menú"
        colorScheme="whiteAlpha"
      />

      {/* Menú lateral */}
      <Drawer isOpen={isOpen} placement="right" onClose={toggleDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              <Link to="/sobre-mi">Sobre mí</Link>
              <Link to="/mi-obra">Mi obra</Link>
              <Link to="/tienda-online">Tienda online</Link>
              <Link to="/nfts">NFTs</Link>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default HamburgerMenu;
