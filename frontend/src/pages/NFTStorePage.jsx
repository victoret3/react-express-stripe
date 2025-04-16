import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NFTStoreItem from '../components/NFTStoreItem';
import './NFTStorePage.css';

const NFTStorePage = () => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true);
        
        // Obtener los NFTs del servidor
        const response = await axios.get('/api/nfts');
        
        if (response.data && response.data.nfts) {
          setNfts(response.data.nfts);
        } else {
          setError('No se encontraron NFTs disponibles');
        }
      } catch (error) {
        console.error('Error al cargar los NFTs:', error);
        setError('Error al cargar los NFTs. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNFTs();
  }, []);
  
  // Filtrar NFTs por tipo
  const filteredNfts = selectedType === 'all' 
    ? nfts 
    : nfts.filter(nft => nft.baseType === selectedType);
  
  // Obtener tipos únicos para el filtro
  const nftTypes = ['all', ...new Set(nfts.map(nft => nft.baseType).filter(Boolean))];
  
  return (
    <div className="nft-store-page">
      <div className="store-header">
        <h1>Colección Kachitomío NFT</h1>
        <p className="store-description">
          Explora y adquiere la colección oficial de Kachitomío by Nani Boronat. 
          Cada NFT es único con su propio estilo y características.
        </p>
      </div>
      
      <div className="filter-container">
        <div className="filter-label">Filtrar por día:</div>
        <div className="filter-options">
          {nftTypes.map(type => (
            <button
              key={type}
              className={`filter-button ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type === 'all' ? 'Todos' : 
               type === 'L' ? 'Lunes' :
               type === 'M' ? 'Martes' :
               type === 'X' ? 'Miércoles' :
               type === 'J' ? 'Jueves' :
               type === 'V' ? 'Viernes' :
               type === 'S' ? 'Sábado' :
               type === 'D' ? 'Domingo' : type}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando NFTs...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="nft-grid">
          {filteredNfts.length > 0 ? (
            filteredNfts.map(nft => (
              <div key={nft.id} className="nft-grid-item">
                <NFTStoreItem nft={nft} />
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No se encontraron NFTs para este filtro.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="store-footer">
        <h2>¿Cómo funciona?</h2>
        <div className="how-it-works">
          <div className="how-it-works-step">
            <div className="step-number">1</div>
            <h3>Explora la colección</h3>
            <p>Navega por nuestra colección de NFTs exclusivos de Kachitomío.</p>
          </div>
          
          <div className="how-it-works-step">
            <div className="step-number">2</div>
            <h3>Compra con tarjeta</h3>
            <p>Selecciona el NFT que deseas y paga fácilmente con tu tarjeta a través de Stripe.</p>
          </div>
          
          <div className="how-it-works-step">
            <div className="step-number">3</div>
            <h3>Recibe tu NFT</h3>
            <p>Nosotros minteamos el NFT para ti y recibirás un correo con los detalles para verlo en OpenSea.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTStorePage; 