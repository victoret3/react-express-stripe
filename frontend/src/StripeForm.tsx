import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';

const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

const StripeForm: React.FC<{ isScriptLoaded: boolean; isScriptLoadSucceed: boolean }> = ({
  isScriptLoaded,
  isScriptLoadSucceed,
}) => {
  const [stripe, setStripe] = useState<any>(null);
  const { cart, clearCart } = useCart();

  useEffect(() => {
    if (isScriptLoaded && isScriptLoadSucceed && window.Stripe) {
      setStripe(window.Stripe(STRIPE_PUBLIC_KEY));
    }
  }, [isScriptLoaded, isScriptLoadSucceed]);

  const handleCheckout = async () => {
    const lineItems = cart.map((item) => ({
      name: item.name,
      description: item.description,
      images: [item.image],
      amount: item.price * 100, // Convertimos a céntimos
      currency: 'eur',
      quantity: 1,
    }));

    const session = await fetch('http://localhost:8888/payment/session-initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lineItems }),
    });

    const { id: sessionId } = await session.json();

    if (stripe) {
      const result = await stripe.redirectToCheckout({ sessionId });
      if (result.error) {
        console.error(result.error.message);
      }
    }
  };

  if (!stripe) return <p>Cargando Stripe...</p>;

  return <button onClick={handleCheckout}>Pagar con Stripe</button>;
};

export default StripeForm;
