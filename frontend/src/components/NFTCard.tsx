import React from 'react';
import { Link } from 'react-router-dom';
import './NFTCard.css';

interface NFTCardProps {
  nft: {
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
  };
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  // Convertir la URL de IPFS a HTTP si es necesario
  const imageUrl = nft.imageUrl?.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${nft.imageUrl.replace('ipfs://', '')}`
    : nft.imageUrl;

  return (
    <Link to={`/collection/${nft.collectionId}/nft/${nft.id}`} className="nft-card">
      <div className="nft-card-image-container">
        <img 
          src={imageUrl || '/placeholder-nft.jpg'} 
          alt={nft.name}
          className="nft-card-image"
        />
        {nft.rarity && (
          <div className={`nft-rarity ${nft.rarity.toLowerCase()}`}>
            {nft.rarity}
          </div>
        )}
      </div>
      
      <div className="nft-card-details">
        <h3 className="nft-card-name" title={nft.name}>
          {nft.name}
        </h3>
        
        {nft.price && (
          <div className="nft-card-price">
            <span className="price-amount">{nft.price} ETH</span>
          </div>
        )}
        
        {nft.owner && (
          <div className="nft-card-owner">
            <span className="owner-label">Owner:</span>
            <span className="owner-address" title={nft.owner}>
              {nft.owner.substring(0, 6)}...{nft.owner.substring(nft.owner.length - 4)}
            </span>
          </div>
        )}
        
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="nft-card-badges">
            {nft.attributes.slice(0, 3).map((attr, index) => (
              <span key={index} className="nft-badge" title={`${attr.trait_type}: ${attr.value}`}>
                {attr.value}
              </span>
            ))}
            {nft.attributes.length > 3 && (
              <span className="nft-badge more">+{nft.attributes.length - 3}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="nft-card-buy">
        <span>Ver detalles</span>
      </div>
    </Link>
  );
};

export default NFTCard; 