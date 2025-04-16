import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './CollectionDetailPage.css';
import { getNFTsFromCollection } from '../utils/collectionContract';
import { ethers } from 'ethers';
import { cleanIpfsUrl } from '../utils/ipfs';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Image, useDisclosure } from '@chakra-ui/react';

interface NFT {
  id: string;
  name: string;
  imageUrl: string;
  collectionId: string;
  price?: string;
  tokenId?: string;
  owner?: string;
  rarity?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  itemCount: number;
  floorPrice?: string;
  creator?: string;
  ownerCount?: number;
  totalVolume?: string;
}

const CollectionDetailPage: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price_asc');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleImageClick = (imageUrl: string) => {
    console.log("Imagen seleccionada:", imageUrl);
    setSelectedImage(imageUrl);
    onOpen();
  };

  useEffect(() => {
    const fetchCollectionFromBlockchain = async () => {
      try {
        setLoading(true);
        
        if (!collectionId) {
          setError('ID de colección no válido');
          setLoading(false);
          return;
        }

        // Obtener los NFTs de la colección de la blockchain
        const nftsFromBlockchain = await getNFTsFromCollection(collectionId);
        console.log('NFTs obtenidos de blockchain:', nftsFromBlockchain);
        
        if (nftsFromBlockchain.length === 0) {
          setError('No se encontraron NFTs en esta colección.');
          setLoading(false);
          return;
        }

        // Extraer información de la colección del primer NFT
        const firstNft = nftsFromBlockchain[0];
        const collectionData: Collection = {
          id: collectionId,
          name: firstNft.collectionName || 'Colección NFT',
          description: 'Colección de NFTs en la blockchain',
          imageUrl: firstNft.image || 'https://via.placeholder.com/500?text=Colección',
          itemCount: nftsFromBlockchain.length,
          floorPrice: ethers.utils.formatEther(
            nftsFromBlockchain.reduce((min, nft) => {
              const price = ethers.BigNumber.from(nft.priceWei);
              return price.lt(min) ? price : min;
            }, ethers.BigNumber.from(nftsFromBlockchain[0].priceWei))
          ),
          creator: firstNft.owner
        };
        
        setCollection(collectionData);
        
        // Convertir los NFTs de blockchain al formato esperado por la UI
        const formattedNfts = nftsFromBlockchain.map(nft => {
          // Extraer atributos de los metadatos (si existen)
          const attributes: Array<{trait_type: string, value: string}> = [];
          
          return {
            id: nft.id,
            name: nft.name,
            imageUrl: cleanIpfsUrl(nft.image),
            collectionId: collectionId,
            price: ethers.utils.formatEther(nft.priceWei),
            tokenId: nft.tokenId,
            owner: nft.owner,
            attributes
          };
        });
        
        setNfts(formattedNfts);
        setLoading(false);
      } catch (err) {
        console.error('Error obteniendo la colección de blockchain:', err);
        setError('No se pudo cargar la colección. Por favor, inténtalo de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchCollectionFromBlockchain();
  }, [collectionId]);

  // Filtrar NFTs según el tipo seleccionado
  const getFilteredNfts = () => {
    let filtered = [...nfts];
    
    if (activeFilter !== 'all') {
      filtered = nfts.filter(nft => {
        const typeAttribute = nft.attributes?.find(attr => attr.trait_type === 'Tipo');
        if (typeAttribute) {
          return typeAttribute.value === activeFilter;
        }
        return false;
      });
    }
    
    // Ordenar según el criterio seleccionado
    return filtered.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      } else if (sortBy === 'price_desc') {
        return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      } else if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  };

  const filteredNfts = getFilteredNfts();
  
  // Extraer tipos únicos para el filtro
  const nftTypes = ['all', ...new Set(nfts.map(nft => {
    const typeAttribute = nft.attributes?.find(attr => attr.trait_type === 'Tipo');
    return typeAttribute?.value || '';
  }).filter(Boolean))];

  if (loading) {
    return (
      <div className="collection-detail-loading">
        <div className="loading-spinner"></div>
        <p>Cargando colección desde blockchain...</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="collection-detail-error">
        <h2>Error</h2>
        <p>{error || 'No se pudo cargar la colección.'}</p>
        <Link to="/collections" className="back-button">Volver a colecciones</Link>
      </div>
    );
  }

  return (
    <div className="collection-detail-page">
      <div className="collection-banner" style={{ backgroundImage: `url(${collection.bannerUrl || collection.imageUrl})` }}>
        <div className="collection-banner-overlay"></div>
      </div>
      
      <div className="collection-content">
        <div className="collection-header">
          <div className="collection-avatar">
            <img src={collection.imageUrl} alt={collection.name} />
          </div>
          
          <div className="collection-info">
            <h1 className="collection-title">{collection.name}</h1>
            
            <div className="collection-creator">
              Por <span>{collection.creator}</span>
            </div>
            
            <p className="collection-description">{collection.description}</p>
            
            <div className="collection-stats">
              <div className="stat-item">
                <span className="stat-value">{collection.itemCount}</span>
                <span className="stat-label">items</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-value">{collection.ownerCount || '10+'}</span>
                <span className="stat-label">propietarios</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-value">{collection.floorPrice} ETH</span>
                <span className="stat-label">precio mín.</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-value">{collection.totalVolume || '2.45'} ETH</span>
                <span className="stat-label">volumen</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="collection-filters">
          <div className="filter-group">
            <div className="filter-label">Filtrar por:</div>
            <div className="filter-buttons">
              {nftTypes.map(type => (
                <button
                  key={type}
                  className={`filter-button ${activeFilter === type ? 'active' : ''}`}
                  onClick={() => setActiveFilter(type)}
                >
                  {type === 'all' ? 'Todos' : type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="sort-group">
            <div className="sort-label">Ordenar por:</div>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="price_asc">Precio: más bajo primero</option>
              <option value="price_desc">Precio: más alto primero</option>
              <option value="name_asc">Nombre: A-Z</option>
              <option value="name_desc">Nombre: Z-A</option>
            </select>
          </div>
        </div>
        
        <div className="nft-grid">
          {filteredNfts.length > 0 ? (
            filteredNfts.map(nft => (
              <div key={nft.id} className="nft-grid-item">
                <div className="nft-card">
                  <div className="nft-image-container">
                    <img 
                      src={nft.imageUrl} 
                      alt={nft.name} 
                      className="nft-image"
                      onClick={() => handleImageClick(nft.imageUrl)} 
                      style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                  
                  <div className="nft-info">
                    <h3 className="nft-title">{nft.name}</h3>
                    <div className="nft-price">{nft.price} ETH</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-nfts-message">
              No se encontraron NFTs con los filtros seleccionados
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para ver la imagen ampliada (igual que en TiendaOnline.tsx) */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent maxW="80vw">
          <ModalHeader></ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Ampliado"
                w="100%"
                maxH="80vh"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CollectionDetailPage; 