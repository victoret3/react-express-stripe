// CartContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Interfaz base de tu producto
export interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
}

// Extendemos la interfaz para añadir la cantidad
interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // El estado 'cart' ahora es un array de CartItem
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === product._id);

      if (existingItem) {
        // Si ya está en el carrito, verifica si puedes aumentar la cantidad según el stock
        if (existingItem.quantity < product.stock) {
          // Aumentar en 1 la cantidad
          return prevCart.map((item) =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // No se puede añadir más cantidad; avisamos al usuario
          alert('Ya has agregado todas las unidades disponibles de este producto.');
          return prevCart;
        }
      } else {
        // Si no existe, se añade con quantity = 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Elimina el producto completo del carrito
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};