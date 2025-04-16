import React, { useState, useEffect } from 'react';
import './ImageZoom.css';

interface ImageZoomProps {
  src: string;
  alt?: string;
}

const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt = "Imagen" }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Detectar tecla ESC para cerrar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isZoomed]);

  // Prevenir scroll cuando el zoom está activo
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isZoomed]);

  return (
    <div className="image-zoom-container">
      <img 
        src={src} 
        alt={alt}
        className="original-image" 
        onClick={toggleZoom}
        style={{ cursor: 'zoom-in' }}
      />
      {isZoomed && (
        <div className="zoom-overlay" onClick={toggleZoom}>
          <div className="zoom-wrapper">
            <img 
              src={src} 
              alt={alt}
              className="zoomed-image" 
              onClick={toggleZoom}
              style={{ cursor: 'zoom-out' }}
            />
          </div>
          <button className="close-button" onClick={toggleZoom}>×</button>
        </div>
      )}
    </div>
  );
};

export default ImageZoom; 