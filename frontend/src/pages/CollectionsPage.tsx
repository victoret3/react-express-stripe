import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CollectionCard from '../components/CollectionCard';
import './CollectionsPage.css';

interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  floorPrice?: string;
  creator?: string;
}

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await axios.get<{collections: Collection[]}>('/api/collections');
        setCollections(response.data.collections);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('No se pudieron cargar las colecciones. Por favor, inténtalo de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchCollections();
  }, []);

  // Filtrar colecciones por búsqueda y categoría
  const filteredCollections = collections.filter(collection => {
    // Filtro de búsqueda
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro de categoría
    const matchesCategory = activeCategory === 'all' ? true : collection.id.includes(activeCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="collections-page">
      <div className="collections-hero">
        <div className="hero-content">
          <h1>Descubre, Colecciona, y Vende NFTs Extraordinarios</h1>
          <p>Las mejores colecciones de NFTs de artistas, creadores y marcas.</p>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar colecciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="collections-container">
        <div className="categories-container">
          <h2>Explorar Colecciones</h2>
          
          <div className="categories-tabs">
            <button
              className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Todas
            </button>
            <button
              className={`category-tab ${activeCategory === 'kachitomio' ? 'active' : ''}`}
              onClick={() => setActiveCategory('kachitomio')}
            >
              Kachitomío
            </button>
            <button
              className={`category-tab ${activeCategory === 'naniboronat' ? 'active' : ''}`}
              onClick={() => setActiveCategory('naniboronat')}
            >
              Nani Boronat
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando colecciones...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="collections-grid">
            {filteredCollections.length > 0 ? (
              filteredCollections.map(collection => (
                <div key={collection.id} className="collection-grid-item">
                  <CollectionCard collection={collection} />
                </div>
              ))
            ) : (
              <div className="no-collections">
                <h3>No hay colecciones disponibles</h3>
                <p>No se encontraron colecciones en este momento.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage; 