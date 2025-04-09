import express from 'express';
import connectDB from '../src/db.js';
import configureServer from '../src/server.js';

// Modelos o rutas que vayas a usar directamente:
import Product from '../src/models/Product.js';
import paymentApi from '../src/routes/payment.js';

const app = express();

// 1) Conectar a MongoDB (sin process.exit)
connectDB();

// 2) Configurar middlewares (CORS, JSON, etc.)
configureServer(app);

// 3) Endpoints de productos
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); 
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, description, image } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'El nombre y el precio son obligatorios.' });
  }

  try {
    const product = new Product({ name, price, description, image });
    const savedProduct = await product.save();
    return res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ message: 'Error al crear producto', error: err.message });
  }
});

// 4) Endpoints de pago
paymentApi(app);

// 5) Exportar `app` para que Vercel la maneje como función serverless
export default app;