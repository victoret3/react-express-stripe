import express from 'express';
import mongoose from 'mongoose';

// Definir el schema para el producto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  stock: { type: Number, default: 0 }
});

// Crear el modelo si no existe
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const productsApi = (app) => {
  // Obtener todos los productos
  app.get('/api/products', async (req, res) => {
    try {
      // Verificar la conexión a MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.log('No hay conexión a MongoDB. Intentando conectar...');
        await mongoose.connect(process.env.MONGO_URI);
      }
      
      console.log('Buscando productos en la colección:', mongoose.connection.db?.databaseName);
      
      // Obtener productos de la base de datos
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

  return app;
};

export default productsApi; 