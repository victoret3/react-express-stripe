import React from 'react';
import { Link } from 'react-router-dom';
import './CollectionCard.css';

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    itemCount: number;
    floorPrice?: string;
    creator?: string;
  };
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
  return (
    <Link to={`/collection/${collection.id}`} className="collection-card">
      <div className="collection-cover">
        <img 
          src={collection.imageUrl || '/placeholder-collection.jpg'} 
          alt={collection.name}
          className="collection-image"
        />
      </div>
      <div className="collection-info">
        <h3 className="collection-name">{collection.name}</h3>
        <div className="collection-meta">
          <span className="collection-count">{collection.itemCount} items</span>
          {collection.floorPrice && (
            <span className="collection-floor">
              Floor: {collection.floorPrice} ETH
            </span>
          )}
        </div>
        <p className="collection-description">{collection.description}</p>
        {collection.creator && (
          <div className="collection-creator">
            by <span>{collection.creator}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default CollectionCard; 