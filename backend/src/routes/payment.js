import Stripe from 'stripe';
import Product from '../models/Product.js'; // Ajusta la ruta si difiere
import express from 'express';

const paymentApi = (app) => {
  // Endpoint de prueba
  app.get('/api/payment', (req, res) => {
    res.send({
      message: 'Ping desde Checkout Server',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });

  // Iniciar checkout
  app.post('/api/payment/session-initiate', async (req, res) => {
    const { lineItems, successUrl, cancelUrl, name, email } = req.body;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
    try {
      console.log('Line items from client:', JSON.stringify(lineItems, null, 2));
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems, // <-- Importante: se pasa tal cual
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['ES', 'AD', 'FR'],
        },
        phone_number_collection: { enabled: true },
        metadata: { name },
      });
  
      return res.status(200).send(session);
    } catch (error) {
      console.error('Error creando la sesión de Stripe:', error);
      return res.status(500).send({ error: error.message });
    }
  });

  // Webhook de Stripe (cuando finaliza la compra)
  app.post('/api/payment/session-complete',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          req.headers['stripe-signature'],
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (error) {
        console.error('Webhook Error:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }

      console.log('Stripe event received:', event); // Añadir console.log para ver lo que Stripe devuelve

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('✔️  checkout.session.completed recibido');
        try {
          // Obtener line items
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
          });

          // Actualizar stock de cada producto
          for (const item of lineItems.data) {
            const productId = item.price?.product?.metadata?.productId;
            if (productId) {
              await Product.findByIdAndUpdate(
                productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
              );
            }
          }

          // Opcional: revisar datos del cliente
          const { customer_details, metadata, shipping_details } = session;
          const name =
            metadata?.name ||
            customer_details?.name ||
            shipping_details?.name ||
            'Nombre no proporcionado';
          console.log('Cliente:', name);
        } catch (error) {
          console.error('Error procesando webhook Stripe:', error.message);
        }

        return res.status(200).send({ received: true });
      } else {
        console.log(`Evento no manejado: ${event.type}`);
        return res.status(200).send({ received: true });
      }
    }
  );

  return app;
};

export default paymentApi;