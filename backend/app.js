// Importar rutas de Stripe
const stripeRoutes = require('./routes/stripe');

// Parsear las solicitudes JSON (IMPORTANTE: esto debe estar ANTES de configurar la ruta del webhook)
app.use(express.json());

// Rutas de stripe para el webhook (necesita el body crudo, no parseado)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes);

// Otras rutas de stripe que usan el body parseado como JSON
app.use('/api/stripe', stripeRoutes); 