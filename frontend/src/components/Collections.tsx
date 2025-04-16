import React, { useEffect, useState } from 'react';
import { getAllCollections, getCollectionsByOwner, CollectionInfo } from '../utils/collectionContract';
import { COLLECTION_FACTORY_ADDRESS } from '../utils/contracts';

const Collections = () => {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [userCollections, setUserCollections] = useState<CollectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetchCollections();
      } catch (error) {
        console.error("Error en la inicialización:", error);
        
        if (
          error instanceof Error && 
          (error.message.includes("429") || error.message.includes("limit exceeded") || error.message.includes("Non-200"))
        ) {
          console.log("Error de límite de tasa detectado, intentando nuevamente en 5 segundos...");
          setTimeout(() => {
            console.log("Reintentando conexión...");
            checkConnection();
          }, 5000);
        } else {
          setError("La red blockchain está congestionada. Por favor, inténtalo de nuevo más tarde.");
          setLoading(false);
        }
      }
    };

    checkConnection();
  }, [account]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Intentando obtener colecciones del contrato:", COLLECTION_FACTORY_ADDRESS);
      const allCollections = await getAllCollections();
      setCollections(allCollections);
      
      if (account) {
        console.log("Obteniendo colecciones para la cuenta:", account);
        const userCollections = await getCollectionsByOwner(account);
        setUserCollections(userCollections);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching collections:", error);
      
      if (
        error instanceof Error && 
        (error.message.includes("429") || error.message.includes("limit exceeded") || error.message.includes("Non-200"))
      ) {
        console.log("Error de límite de tasa al obtener colecciones, reintentando en 5 segundos...");
        setTimeout(() => {
          console.log("Reintentando obtener colecciones...");
          fetchCollections();
        }, 5000);
      } else {
        setError("No se pudieron cargar las colecciones. La red está congestionada, inténtalo más tarde.");
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Collections; 