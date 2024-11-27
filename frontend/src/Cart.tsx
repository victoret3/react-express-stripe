import React from 'react';
import { useCart } from './CartContext';

const CURRENCY = 'eur';

const toCent = (amount: number): number => amount * 100;

const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  // Calcular el total del carrito
  const totalAmount = cart.reduce((sum: number, item: { price: number }) => sum + item.price, 0);

  const handleCheckout = async () => {
    const lineItems = cart.map((item: { name: string; description: string; image: string; price: number }) => ({
      name: item.name,
      description: item.description,
      images: [item.image],
      amount: toCent(item.price),
      currency: CURRENCY,
      quantity: 1,
    }));

    console.log('Line Items for Checkout:', lineItems);

    // Aquí iría la lógica para iniciar Stripe Checkout
  };

  return (
    <div>
      <h1>Carrito de Compras</h1>
      <p>Total: ${totalAmount.toFixed(2)}</p>
      <button onClick={handleCheckout}>Checkout</button>
      <div>
        <ul>
          {cart.map((item: any) => (
            <li key={item.id}>
              {item.name} - ${item.price}
              <button onClick={() => removeFromCart(item.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
        <button onClick={clearCart}>Vaciar carrito</button>
      </div>
    </div>
  );
};

export default Cart;
