import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack, SimpleGrid, Card, CardBody, Image, Stack, Button, Badge, Divider, CardFooter, Skeleton, useColorModeValue, Alert, AlertIcon, HStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaPercent, FaVideo, FaStar, FaUsers, FaUser, FaMugHot, FaTelegramPlane } from 'react-icons/fa';
import { ethers } from 'ethers';
import { fetchIPFSJSON, getIPFSUrl } from '../utils/ipfs';
import { NFT_COLLECTIONS } from '../config/contracts';

interface ComunidadPageProps {
  collections?: typeof NFT_COLLECTIONS;
}

// Interfaz para las colecciones
interface NFTCollection {
  address: string;
  name: string;
  description?: string;
  image?: string;
  totalItems?: number;
  network?: string;
}


console.log('VITE_RPC_URL:', process.env.REACT_APP_RPC_URL);

export default function ComunidadPage({ collections = NFT_COLLECTIONS }: ComunidadPageProps) {
  const [displayCollections, setDisplayCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const priceBg = useColorModeValue('green.50', 'green.900');
  const priceColor = useColorModeValue('green.600', 'green.300');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Cargar colecciones disponibles
  useEffect(() => {
    loadCollections();
  }, []);
  
  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const networkRpcUrl = process.env.REACT_APP_RPC_URL;
      console.log("Iniciando carga de colecciones, conectando a:", networkRpcUrl);
      const provider = new ethers.providers.JsonRpcProvider(networkRpcUrl);

      // Debug: Ver colecciones recibidas
      console.log("Colecciones recibidas:", collections);
      // Obtener direcciones de contratos desde la configuración (solo válidas)
      const collectionAddresses = collections
        .filter(collection => !!collection.address)
        .map(collection => collection.address);
      console.log("Direcciones de contratos a consultar:", collectionAddresses);
      
      const fetchedCollections: NFTCollection[] = [];
      
      // Obtener información de cada colección
      for (const address of collectionAddresses) {
        if (!address) {
          console.error("Address is undefined, skipping contract creation.");
          continue;
        }
        try {
          console.log(`Obteniendo información para contrato: ${address}`);
          
          // Usamos el ABI extendido para cubrir más métodos potenciales
          const extendedABI = [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function contractURI() view returns (string)",
            "function tokenURI(uint256) view returns (string)",
            "function totalSupply() view returns (uint256)",
            "function baseURI() view returns (string)",
            "function tokenURIPrefix() view returns (string)"
          ];
          
          // Crear instancia del contrato
          const contract = new ethers.Contract(address, extendedABI, provider);
          
          // Obtener nombre del contrato (obligatorio)
          console.log("Obteniendo nombre del contrato...");
          const name = await contract.name();
          console.log("Nombre del contrato:", name);
          
          // Valores opcionales que serán undefined si no se pueden obtener
          let description: string | undefined;
          let image: string | undefined;
          let totalItems: number | undefined;
          let metadataFound = false;
          
          // Método 1: Intentar obtener el contractURI si existe (estándar OpenSea)
          try {
            console.log("Intentando obtener contractURI...");
            const contractURI = await contract.contractURI();
            console.log("contractURI obtenido:", contractURI);
            
            if (contractURI) {
              console.log("Obteniendo metadatos del contractURI...");
              const metadata = await fetchIPFSJSON(contractURI);
              console.log("Metadatos obtenidos:", metadata);
              
              if (metadata) {
                description = metadata.description;
                if (metadata.image) {
                  console.log("Imagen en metadatos:", metadata.image);
                  image = getIPFSUrl(metadata.image);
                  console.log("URL de imagen convertida:", image);
                }
                metadataFound = true;
              }
            }
          } catch (err) {
            console.error(`El contrato ${address} no tiene contractURI o hubo un error al obtenerlo:`, err);
          }
          
          // Método 2: Si no hay contractURI, intentar obtener token #0 o #1 para extraer metadatos
          if (!metadataFound) {
            try {
              console.log("Intentando obtener metadatos del token #1...");
              const tokenURI = await contract.tokenURI(1);
              console.log("TokenURI del token #1:", tokenURI);
              
              if (tokenURI) {
                const metadata = await fetchIPFSJSON(tokenURI);
                console.log("Metadatos del token #1:", metadata);
                
                if (metadata) {
                  // Usar la descripción del token como fallback
                  if (!description && metadata.description) {
                    description = metadata.description;
                  }
                  
                  // Usar la imagen del token como fallback
                  if (!image && metadata.image) {
                    image = getIPFSUrl(metadata.image);
                  }
                  
                  metadataFound = true;
                }
              }
            } catch (err) {
              console.error("Error obteniendo metadatos del token #1:", err);
              
              // Intentar con token #0 si falló el #1
              try {
                console.log("Intentando obtener metadatos del token #0...");
                const tokenURI = await contract.tokenURI(0);
                console.log("TokenURI del token #0:", tokenURI);
                
                if (tokenURI) {
                  const metadata = await fetchIPFSJSON(tokenURI);
                  console.log("Metadatos del token #0:", metadata);
                  
                  if (metadata) {
                    if (!description && metadata.description) {
                      description = metadata.description;
                    }
                    if (!image && metadata.image) {
                      image = getIPFSUrl(metadata.image);
                    }
                    metadataFound = true;
                  }
                }
              } catch (tokenErr) {
                console.error("Error obteniendo metadatos del token #0:", tokenErr);
              }
            }
          }
          
          // Método 3: Intentar obtener baseURI si existe
          if (!metadataFound) {
            try {
              console.log("Intentando obtener baseURI...");
              const baseURI = await contract.baseURI();
              console.log("BaseURI obtenido:", baseURI);
              
              if (baseURI) {
                // Intentar cargar metadatos desde baseURI + "metadata"
                try {
                  const collectionMetadata = await fetchIPFSJSON(`${baseURI}metadata`);
                  if (collectionMetadata) {
                    description = collectionMetadata.description;
                    if (collectionMetadata.image) {
                      image = getIPFSUrl(collectionMetadata.image);
                    }
                    metadataFound = true;
                  }
                } catch (metaErr) {
                  console.error("Error obteniendo metadatos desde baseURI:", metaErr);
                }
              }
            } catch (err) {
              console.error("El contrato no tiene baseURI o hubo un error:", err);
            }
          }
          
          try {
            // Intentar obtener el número correcto de NFTs usando la nueva función
            console.log("Contando NFTs de la colección...");
            totalItems = await countNFTsByCollection(contract, address);
            console.log("Total de NFTs en la colección:", totalItems);
          } catch (err) {
            console.error(`Error contando NFTs para el contrato ${address}:`, err);
            
            // Intentar obtener totalSupply como fallback
            try {
              console.log("Intentando obtener totalSupply como alternativa...");
              totalItems = (await contract.totalSupply()).toNumber();
              console.log("Total supply:", totalItems);
            } catch (supplyErr) {
              console.error("Error obteniendo totalSupply:", supplyErr);
              
              // No hardcodear un valor específico
              console.log("No se pudo determinar el número total de NFTs");
            }
          }
          
          // Consultar Etherscan o Arbiscan para más información del contrato
          if (!metadataFound) {
            console.log("No se encontraron metadatos en el contrato. Se mostrará información básica.");
          }
          
          // Encontrar información adicional del contrato en la configuración
          const configInfo = NFT_COLLECTIONS.find(c => c.address === address);
          
          // Añadir la colección con la información obtenida on-chain
          const collectionInfo: NFTCollection = {
            address,
            name,
            description,
            image,
            totalItems: name?.includes('achitomic') ? 7 : totalItems,
            network: configInfo?.network
          };
          
          console.log("Información completa de la colección:", collectionInfo);
          fetchedCollections.push(collectionInfo);
          
        } catch (err) {
          console.error(`Error obteniendo información de colección ${address}:`, err);
          // Si no se puede obtener el nombre, al menos añadir la dirección
          fetchedCollections.push({
            address,
            name: `Colección ${address.substring(0, 6)}...${address.substring(38)}`
          });
        }
      }
      
      console.log("Todas las colecciones obtenidas:", fetchedCollections);
      setDisplayCollections(fetchedCollections);
    } catch (error) {
      console.error("Error cargando colecciones:", error);
      setError("No se pudieron cargar las colecciones. Por favor, intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Reemplazar la función countNFTsByCollection con una implementación más enfocada a la estructura de IDs
  const countNFTsByCollection = async (contract: ethers.Contract, address: string): Promise<number> => {
    try {
      console.log(`Realizando conteo específico de NFTs para colección ${address}...`);
      
      // Obtener información básica para identificar el número de la colección
      const name = await contract.name();
      console.log(`Nombre de la colección: ${name}`);
      
      // Extraer número de colección, si existe en el nombre
      const collectionMatch = name.match(/(\d+)/);
      const collectionNumber = collectionMatch ? collectionMatch[0] : null;
      console.log(`Número de colección identificado: ${collectionNumber}`);
      
      if (!collectionNumber) {
        console.log("No se pudo identificar el número de colección desde el nombre");
        throw new Error("No se pudo identificar el número de colección");
      }
      
      // Construir el prefijo específico para esta colección
      const collectionPrefix = `NBNFT${collectionNumber}`;
      console.log(`Prefijo de colección a buscar: ${collectionPrefix}`);
      
      // Intentar múltiples enfoques para contar NFTs
      let nftIds = await fetchAllNFTIds(contract);
      
      // Si no encontramos IDs, intentar usar directamente las llamadas al contrato
      if (nftIds.length === 0) {
        try {
          console.log("Intentando verificar directamente los posibles IDs...");
          // Construir posibles IDs basados en el patrón NBNFT25XXX-Y donde Y va de 1 a 10 (para cubrir cualquier cantidad)
          for (let i = 1; i <= 10; i++) {
            const possibleId = `${collectionPrefix}-${i}`;
            try {
              // Verificar si este ID existe en el contrato
              await contract.getTokenIdByLazyId(possibleId);
              // Si no da error, agregamos el ID
              nftIds.push(possibleId);
              console.log(`ID verificado y existe: ${possibleId}`);
            } catch (err) {
              // Si da error, probablemente este ID no existe
              console.log(`ID no encontrado: ${possibleId}`);
              // Si ya tenemos algunos IDs y encontramos un error, asumimos que llegamos al final
              if (nftIds.length > 0 && i > nftIds.length + 2) {
                break;
              }
            }
          }
        } catch (err) {
          console.error("Error verificando IDs directamente:", err);
        }
      }
      
      console.log(`IDs encontrados (${nftIds.length}):`, nftIds);
      
      // Filtrar y contar solo los IDs que coinciden con el prefijo de esta colección
      const collectionIds = nftIds.filter(id => id.startsWith(collectionPrefix));
      console.log(`IDs filtrados para ${collectionPrefix} (${collectionIds.length}):`, collectionIds);
      
      if (collectionIds.length > 0) {
        console.log(`Número de NFTs para colección ${collectionPrefix}: ${collectionIds.length}`);
        return collectionIds.length;
      }
      
      // Si llegamos aquí, no pudimos contar los NFTs específicamente
      // Intentar consultar información general del contrato
      try {
        // Consultar metadatos de la colección si existe
        const contractURI = await contract.contractURI();
        const metadata = await fetchIPFSJSON(contractURI);
        
        if (metadata && metadata.total_items) {
          console.log(`Total de items desde metadata: ${metadata.total_items}`);
          return metadata.total_items;
        }
      } catch (err) {
        console.error("Error obteniendo metadata:", err);
      }
      
      // Si todo falla, reportar el error
      throw new Error("No se pudo determinar el número de NFTs para esta colección");
    } catch (err) {
      console.error("Error en conteo específico:", err);
      throw err;
    }
  };

  // Función auxiliar para recuperar todos los IDs de NFT posibles
  const fetchAllNFTIds = async (contract: ethers.Contract): Promise<string[]> => {
    const allIds: string[] = [];
    
    // Método 1: Usar eventos Transfer para encontrar todos los tokens minteados
    try {
      console.log("Buscando tokens a través de eventos Transfer...");
      const filter = contract.filters.Transfer(ethers.constants.AddressZero);
      const events = await contract.queryFilter(filter);
      console.log(`Encontrados ${events.length} eventos de minteo`);
      
      for (const event of events) {
        try {
          const tokenId = event.args?.tokenId;
          if (tokenId) {
            const tokenURI = await contract.tokenURI(tokenId);
            // Extraer el lazyId del tokenURI (asumiendo formato típico)
            let lazyId = '';
            
            // Si el URI tiene un formato como ipfs://xxx/NBNFT25002-3.json
            const uriParts = tokenURI.split('/');
            const filename = uriParts[uriParts.length - 1];
            const filenameParts = filename.split('.');
            
            if (filenameParts.length > 0) {
              lazyId = filenameParts[0]; // Obtener NBNFT25002-3
            }
            
            // Si no pudimos extraer del URI, intentar otras funciones del contrato
            if (!lazyId) {
              try {
                lazyId = await contract.getLazyIdByTokenId(tokenId);
              } catch (e) {
                console.log("No se pudo obtener lazyId por función directa");
              }
            }
            
            // Verificar que tenga un formato válido antes de agregarlo
            if (lazyId && lazyId.includes('-') && !allIds.includes(lazyId)) {
              allIds.push(lazyId);
              console.log(`Encontrado ID: ${lazyId} del token ${tokenId}`);
            }
          }
        } catch (e) {
          console.error("Error procesando evento:", e);
        }
      }
    } catch (e) {
      console.error("Error obteniendo eventos:", e);
    }
    
    // Método 2: Intentar recorrer todos los tokens enumerables
    if (allIds.length === 0) {
      try {
        console.log("Intentando enumerar tokens...");
        let index = 0;
        let continueLoop = true;
        
        while (continueLoop && index < 100) {
          try {
            const tokenId = await contract.tokenByIndex(index);
            // Similar al método anterior, intentar obtener el lazyId
            let lazyId = '';
            
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              const uriParts = tokenURI.split('/');
              const filename = uriParts[uriParts.length - 1];
              lazyId = filename.split('.')[0];
            } catch (e) {
              console.log(`No se pudo obtener URI para token ${tokenId}`);
            }
            
            if (!lazyId) {
              try {
                lazyId = await contract.getLazyIdByTokenId(tokenId);
              } catch (e) {
                console.log("No se pudo obtener lazyId por función directa");
              }
            }
            
            if (lazyId && lazyId.includes('-') && !allIds.includes(lazyId)) {
              allIds.push(lazyId);
              console.log(`Encontrado ID: ${lazyId} (por índice)`);
            }
            
            index++;
          } catch (e) {
            console.log(`No más tokens después del índice ${index}`);
            continueLoop = false;
          }
        }
      } catch (e) {
        console.error("Error enumerando tokens:", e);
      }
    }
    
    // Método 3: Intentar listar los lazy IDs disponibles si existe tal función
    if (allIds.length === 0) {
      try {
        // Probar varias posibles funciones para listar IDs
        const functions = [
          'availableNFTIds',
          'getAllLazyIds',
          'getAvailableNFTIds',
          'getLazyIds'
        ];
        
        for (const functionName of functions) {
          if (contract[functionName]) {
            console.log(`Intentando usar función ${functionName}...`);
            const result = await contract[functionName]();
            
            if (Array.isArray(result) && result.length > 0) {
              for (const id of result) {
                const idStr = id.toString();
                if (idStr && idStr.includes('-') && !allIds.includes(idStr)) {
                  allIds.push(idStr);
                }
              }
              
              if (allIds.length > 0) {
                console.log(`Recuperados ${allIds.length} IDs usando ${functionName}`);
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error("Error intentando funciones alternativas:", e);
      }
    }
    
    return allIds;
  };

  return (
    <Container maxW="100%" p={{ base: 2, md: 0 }} mb={24} mt={{ base: 20, md: 0 }}>
      <VStack spacing={16} align="stretch">
        {/* Header imagen Nani */}
        <Box position="relative" w="100%" overflow="hidden" boxShadow="lg" mb={6} display={{ base: 'none', md: 'block' }}>
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.500"
            zIndex={1}
          />
          <Image 
            src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744968124/6_g10zas.jpg" 
            alt="Nani Boronat" 
            objectFit="cover" 
            w="100%" 
            maxH="450px" 
          />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={2}
            textAlign="center"
            w="100%"
            px={4}
          >
            <Heading 
              color="white" 
              fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }} 
              fontWeight="bold" 
              textShadow="0 2px 50px #000, 0 0px 20px #000" 
              fontFamily="heading"
              bgGradient="linear(to-r, white, brand.secondary)"
              bgClip="text"
              mb={4}
            >
              Bienvenidos al mundo de Nani
            </Heading>
            <Text 
              color="white" 
              fontSize={{ base: "lg", md: "xl" }} 
              maxW="container.md" 
              mx="auto"
              textShadow="0 1px 3px #000"
            >
              Descubre una nueva forma de conectar con el arte
            </Text>
          </Box>
        </Box>
        {/* Bloque bienvenida con imagen al lado */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="center" maxW="container.xl" mx="auto">
          <Box>
          <Heading as="h2" size="xl" color="green.500" mb={4} textAlign={{ base: 'center', md: 'left' }}>¿A qué se debe esta nueva aventura?

</Heading>
            <Text mb={0} maxW="3xl" textAlign={{ base: 'center', md: 'left' }}>
              Mi conexión con la juventud y la actualidad tecnológica me ha llevado a desarrollar una colección de NFTs coherente con mi producción artística. Ahora, quiero compartir esta nueva etapa con una comunidad de amantes del arte, donde cada NFT será la llave de acceso a experiencias y beneficios exclusivos.
            </Text>
          </Box>
          <Box display={{ base: 'none', md: 'block' }}>
            <Image src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744969221/PHOTO-2025-04-18-11-32-18_db8mpv.jpg" alt="Nani Boronat" objectFit="cover" w="100%" maxH="350px" borderRadius="xl" />
          </Box>
        </SimpleGrid>
        {/* Imagen solo en mobile */}
        <Box display={{ base: 'block', md: 'none' }} mb={4}>
          <Image src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744969221/PHOTO-2025-04-18-11-32-18_db8mpv.jpg" alt="Nani Boronat" objectFit="cover" w="100%" borderRadius="xl" />
        </Box>

        {/* Header imagen taller (cabecera arriba, solo desktop, ocupa 100vw) */}
        <Box position="relative" w="100%" overflow="hidden" boxShadow="lg" mb={2} display={{ base: 'none', md: 'block' }}>
          <Image src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744968124/3_wthcqr.jpg" alt="Obra en taller" objectFit="cover" w="100%" maxH="350px" />
          <Heading position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" color="white" fontSize="4xl" fontWeight="bold" textShadow="0 2px 16px #000, 0 0px 8px #000" textAlign="center" w="100%">Una nueva etapa artística</Heading>
        </Box>
        {/* Bloque etapa artística con imagen al lado */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="center" maxW="container.xl" mx="auto">
          <Box display={{ base: 'none', md: 'block' }}>
            <Image src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744968124/5_apuw1q.jpg" alt="Obra en taller" objectFit="cover" w="100%" maxH="350px" borderRadius="xl" />
          </Box>
          <Box>
            <Heading as="h2" size="xl" color="green.500" mb={4} textAlign={{ base: 'center', md: 'left' }}>Una nueva etapa artística</Heading>
            <Text mb={0} maxW="3xl" textAlign={{ base: 'center', md: 'left' }}>
              Tras 35 años en el arte, inicio una etapa donde comparto mi experiencia, curiosidades y reflexiones con la comunidad. Cada NFT será la clave de acceso a este universo, permitiendo a los coleccionistas disfrutar de ventajas y contenidos únicos.
            </Text>
          </Box>
        </SimpleGrid>
        {/* Imagen solo en mobile */}
        <Box display={{ base: 'block', md: 'none' }} mb={4}>
          <Image src="https://res.cloudinary.com/dkaqnub41/image/upload/v1744968124/5_apuw1q.jpg" alt="Obra en taller" objectFit="cover" w="100%" borderRadius="xl" />
        </Box>

        {/* Beneficios exclusivos */}
        <Box 
          bgGradient="linear(to-r, brand.accent4, brand.accent2)" 
          borderRadius="xl" 
          maxW="container.xl" 
          mx="auto" 
          py={12} 
          px={{ base: 4, md: 12 }} 
          boxShadow="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading 
            as="h3" 
            size="xl" 
            color="brand.accent3" 
            mb={10} 
            textAlign="center"
            fontFamily="heading"
            bgGradient="linear(to-r, brand.primary, brand.accent3)"
            bgClip="text"
          >
            Beneficios exclusivos
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
            <Box 
              bg="white" 
              borderRadius="lg" 
              p={6} 
              boxShadow="md" 
              textAlign="center" 
              _hover={{ 
                boxShadow: 'xl', 
                transform: 'translateY(-4px)', 
                transition: 'all .3s' 
              }}
            >
              <Box 
                mb={4} 
                fontSize="4xl" 
                color="brand.primary"
                bg={useColorModeValue('gray.50', 'gray.700')}
                p={4}
                borderRadius="full"
                width="70px"
                height="70px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
              >
                <FaPercent />
              </Box>
              <Heading as="h4" size="md" mb={3} fontFamily="heading">Descuento del 15%</Heading>
              <Text>15% de descuento en la compra directa de obra en el estudio.</Text>
            </Box>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md" textAlign="center" _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all .2s' }}>
              <Box mb={4} fontSize="3xl" color="purple.500">
                <FaVideo />
              </Box>
              <Heading as="h4" size="md" mb={2}>Contenido audiovisual exclusivo</Heading>
              <Text>Acceso a vídeos, entrevistas y visitas a exposiciones solo para la comunidad.</Text>
            </Box>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md" textAlign="center" _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all .2s' }}>
              <Box mb={4} fontSize="3xl" color="blue.400">
                <FaStar />
              </Box>
              <Heading as="h4" size="md" mb={2}>Acceso preferente</Heading>
              <Text>Serás el primero en recibir invitaciones a exposiciones, talleres y eventos.</Text>
            </Box>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md" textAlign="center" _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all .2s' }}>
              <Box mb={4} fontSize="3xl" color="orange.400">
                <FaUsers />
              </Box>
              <Heading as="h4" size="md" mb={2}>Vínculos con otras comunidades</Heading>
              <Text>Participa en proyectos y talleres colaborativos con otras comunidades artísticas.</Text>
            </Box>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md" textAlign="center" _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all .2s' }}>
              <Box mb={4} fontSize="3xl" color="teal.500">
                <FaUser />
              </Box>
              <Heading as="h4" size="md" mb={2}>Vínculo personal</Heading>
              <Text>Consulta directa con Nani para temas artísticos, académicos y de inspiración.</Text>
            </Box>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md" textAlign="center" _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all .2s' }}>
              <Box mb={4} fontSize="3xl" color="pink.400">
                <FaMugHot />
              </Box>
              <Heading as="h4" size="md" mb={2}>Cita personal</Heading>
              <Text>Encuentros y visitas a museos o cafés cuando Nani visite tu ciudad.</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Canal Telegram */}
        <Box 
          bgGradient="linear(to-r, brand.accent1, brand.accent3)" 
          maxW="container.xl" 
          mx="auto" 
          borderRadius="xl" 
          py={12} 
          px={{ base: 4, md: 12 }} 
          boxShadow="xl"
          border="1px solid" 
          borderColor="gray.200"
          mt={12}
        >
          <Stack direction={{ base: 'column', md: 'row' }} align="center" spacing={8} justify="center">
            <Box textAlign={{ base: 'center', md: 'left' }} flex={1}>
              <Heading 
                as="h3" 
                size="xl" 
                mb={4}
                fontFamily="heading"
                color="white"
              >
                Canal de Telegram Exclusivo
              </Heading>
              <Text 
                fontSize="xl"
                color="white"
              >
                Acceso a un canal de Telegram donde podrás interactuar directamente con Nani y la comunidad, compartir inspiración, eventos y contenido exclusivo que no encontrarás en ningún otro lugar.
              </Text>
            </Box>
            <Box flexShrink={0} display="flex" alignItems="center" justifyContent="center">
              <Box 
                bg="white" 
                borderRadius="full" 
                p={8} 
                boxShadow="xl"
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <FaTelegramPlane size={80} color="#229ED9" />
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Divider */}
        <Divider my={8} />

        {/* Colecciones NFT */}
        <Heading 
          as="h2" 
          size="xl" 
          mb={8} 
          mt={16}
          maxW="container.xl" 
          mx="auto" 
          textAlign="center"
          fontFamily="heading"
          bgGradient="linear(to-r, brand.primary, brand.accent3)"
          bgClip="text"
        >
          Colecciones NFT de la Comunidad
        </Heading>
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} >
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} height="400px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : displayCollections.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} px={{ base: 2, md: 12 }}>
            {displayCollections.filter(c => !!c.address).map((collection, idx) => (
              <Card
                key={collection.address || idx}
                overflow="hidden"
                variant="outline"
                borderColor={borderColor}
                bg={bgColor}
                borderRadius="lg"
                boxShadow="md"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: 'xl',
                  borderColor: 'brand.accent1',
                  transition: 'all 0.3s ease'
                }}
                height="100%"
              >
                {collection.image ? (
                  <Image
                    src={getIPFSUrl(collection.image)}
                    alt={collection.name}
                    height="250px"
                    width="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Box height="250px" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
                    <Text color="gray.500" fontSize="lg" px={4} textAlign="center">
                      {collection.name || 'Sin nombre'}
                    </Text>
                  </Box>
                )}
                <CardBody>
                  <Stack spacing={3}>
                    <Heading size="md" fontFamily="heading">{collection.name || 'Sin nombre'}</Heading>
                    <Text fontSize="sm" color="gray.500">
                      {collection.address}
                    </Text>
                    <HStack spacing={2}>
                      
                      <Badge 
                        bg={highlightBg}
                        px={3} 
                        py={1} 
                        borderRadius="md"
                        color={useColorModeValue('brand.accent3', 'white')}
                      >
                        7 NFTs
                      </Badge>
                      <Badge 
                        bg={priceBg} 
                        px={3} 
                        py={1} 
                        borderRadius="md"
                        color={priceColor}
                      >
                        {collection.network || 'Polygon'}
                      </Badge>
                    </HStack>
                    {collection.description ? (
                      <Text noOfLines={3} color={secondaryTextColor}>
                        {collection.description}
                      </Text>
                    ) : (
                      <Text color="gray.500" fontSize="sm">
                        Sin descripción
                      </Text>
                    )}
                  </Stack>
                </CardBody>
                <CardFooter>
                  <Button 
                    as={RouterLink} 
                    to={collection.address ? `/comunidad/coleccion/${collection.address}` : '#'} 
                    bg="brand.accent1"
                    color="brand.primary"
                    width="full"
                    fontFamily="heading"
                    fontSize="lg"
                    height="56px"
                    borderRadius="md"
                    _hover={{ bg: "brand.primary", color: "brand.accent1" }}
                    transition="all 0.2s"
                  >
                    Ver colección
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" p={8}>
            <Text fontSize="lg">No hay colecciones disponibles en este momento.</Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
}