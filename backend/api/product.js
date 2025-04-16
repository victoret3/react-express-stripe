const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Definir el schema para el producto (igual que en el original)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  stock: { type: Number, default: 0 }
});

// Crear el modelo si no existe (evita registro duplicado)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

// Obtener todos los productos - EXACTAMENTE COMO ESTABA EN EL ORIGINAL
router.get('/api/products', async (req, res) => {
  // Configurar CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Responder a OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verificar la conexión a MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('No hay conexión a MongoDB. Intentando conectar...');
      try {
        console.log('⚠️ Estado de MONGO_URI:', process.env.MONGO_URI ? 'Definido' : 'Indefinido');
        
        if (!process.env.MONGO_URI) {
          throw new Error('MONGO_URI no está definido en las variables de entorno');
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conexión a MongoDB establecida');
      } catch (connError) {
        console.error('Error al conectar a MongoDB:', connError);
        return res.json([
          {
            _id: "offline-1",
            name: "Error de Conexión",
            price: 0,
            description: "No se pudo conectar a la base de datos. Por favor, inténtelo más tarde.",
            image: "https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png",
            stock: 0
          }
        ]);
      }
    }
    
    console.log('Buscando productos en la colección:', mongoose.connection.db?.databaseName);
    
    // Obtener productos - IGUAL QUE EN EL ORIGINAL
    const products = await Product.find({});
    console.log(`Se encontraron ${products.length} productos en la base de datos`);
    
    // Devolver los productos
    return res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    // Si hay un error, devolver un array vacío para evitar errores en el cliente
    return res.json([]);
  }
});

// Endpoint para status
router.get('/api/products/status', (req, res) => {
  res.json({
    status: 'ok',
    mongodbUri: process.env.MONGO_URI ? 'definido' : 'no definido',
    mongoConnection: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
    mongoState: mongoose.connection.readyState
  });
});

module.exports = router; 