import { CollectionInfo } from '../utils/collectionContract';

// Interfaz extendida que incluye los campos necesarios para los componentes
export interface Collection extends Omit<CollectionInfo, 'imageCid'> {
  image: string;        // En lugar de imageCid
  address: string;      // Alias para collectionAddress
  nfts?: any[];         // Lista opcional de NFTs
}

// Función para convertir de CollectionInfo a Collection
export const mapCollectionInfoToCollection = (info: CollectionInfo): Collection => {
  return {
    ...info,
    image: info.imageCid,
    address: info.collectionAddress
  };
}; 