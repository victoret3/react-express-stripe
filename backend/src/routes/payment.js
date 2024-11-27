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
    const { lineItems, successUrl, cancelUrl } = req.body;

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Clave de Stripe desde .env

    let session;

    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      return res.status(500).send({ error: error.message });
    }

    return res.status(200).send(session);
  });

  app.post('/payment/session-complete', async (req, res) => {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Clave de Stripe desde .env

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET // Se usa el webhook secret desde .env
      );
    } catch (error) {
      console.error('Webhook Error:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        console.log('Pago completado:', session);
        // Completar lógica adicional aquí
      } catch (error) {
        console.error('Error procesando la orden:', error);
        return res.status(500).send({ error, session });
      }
    }

    return res.status(200).send({ received: true });
  });

  return app;
};

export default paymentApi;
