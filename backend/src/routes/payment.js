import Stripe from 'stripe';

const paymentApi = (app) => {
  app.get('/', (req, res) => {
    res.send({
      message: 'Ping from Checkout Server',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });

  app.post('/payment/session-initiate', async (req, res) => {
    const { lineItems, successUrl, cancelUrl, name, email } = req.body; // El teléfono será solicitado por Stripe

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email, // Email para asociar el cliente
        billing_address_collection: 'required', // Recolectar datos de facturación
        shipping_address_collection: {
          allowed_countries: ['ES', 'AD', 'FR'], // Países permitidos
        },
        phone_number_collection: {
          enabled: true, // Habilitar la recolección del número de teléfono
        },
        metadata: {
          name, // Pasa el nombre como metadata
        },
      });

      res.status(200).send(session);
    } catch (error) {
      console.error('Error creando sesión de Stripe:', error);
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/payment/session-complete', async (req, res) => {
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('✔️ Evento recibido: checkout.session.completed');
      console.log('Detalles de la sesión:', JSON.stringify(session, null, 2));

      try {
        const { customer_details, metadata, shipping_details } = session;

        // Capturamos el nombre desde varias fuentes posibles
        const name =
          metadata?.name || // Nombre pasado como metadata
          customer_details?.name || // Nombre del cliente
          shipping_details?.name || // Nombre del envío
          'Nombre no proporcionado';

        const phone = customer_details?.phone || 'Teléfono no proporcionado';

        console.log(`✔️ Detalles del cliente:
        Nombre: ${name},
        Email: ${customer_details?.email},
        Teléfono: ${phone},
        Dirección: ${shipping_details?.address?.line1},
        Ciudad: ${shipping_details?.address?.city},
        Código Postal: ${shipping_details?.address?.postal_code},
        País: ${shipping_details?.address?.country}`);
      } catch (error) {
        console.error('❌ Error procesando la información del cliente:', error.message);
      }

      res.status(200).send({ received: true });
    } else {
      console.log(`Evento no manejado: ${event.type}`);
      res.status(200).send({ received: true });
    }
  });

  return app;
};

export default paymentApi;
