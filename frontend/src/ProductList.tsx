import React, { useEffect, useState } from 'react';
import { Product } from './types/Product';
import { useCart } from './CartContext';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('http://localhost:8888/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data); // Ahora TypeScript entiende que los datos tienen el tipo `Product[]`
        setLoading(false);
      })
      .catch((error) => console.error('Error fetching products:', error));
  }, []);

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  return (
    <div>
      {products.map((product) => (
        <div
          key={product.id}
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            marginBottom: '10px',
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '150px', objectFit: 'cover' }}
          />
          <h2 style={{ fontSize: '1.2rem' }}>{product.name}</h2>
          <p>{product.description}</p>
          <p style={{ fontWeight: 'bold' }}>${product.price}</p>
          <button onClick={() => addToCart(product)}>Añadir al carrito</button>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
