import express from 'express';
import SERVER_CONFIGS from './constants/server';
import configureServer from './server';
import configureRoutes from './routes';
import connectDB from './db.js'; // Importa la conexión a MongoDB
import Product from './models/Product.js'; // Ajusta la ruta según tu estructura de carpetas


const app = express();

// Conectar a MongoDB
connectDB();

configureServer(app);
configureRoutes(app);

app.listen(SERVER_CONFIGS.PORT, (error) => {
  if (error) throw error;
  console.log(`Server running on port: ${SERVER_CONFIGS.PORT}`);
});

// Endpoint para listar productos
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find(); // Obtén todos los productos
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
});

// Endpoint para crear un producto
app.post('/products', async (req, res) => {
  const { name, price, description, image } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'El nombre y el precio son obligatorios.' });
  }

  try {
    const product = new Product({ name, price, description, image });
    const savedProduct = await product.save(); // Guarda el producto en MongoDB
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
});


