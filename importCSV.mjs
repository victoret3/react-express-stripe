import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import Product from './backend/src/models/Product.js'; // Ajusta la ruta si es necesario

mongoose.connect('mongodb+srv:', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conexión exitosa a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

const products = [];

fs.createReadStream('productos.csv') // Ajusta la ruta a tu CSV
  .pipe(csv())
  .on('data', (row) => {
    // Asumiendo que el CSV tiene la cabecera: name,price,description,image,stock
    const product = {
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      image: row.image,
      stock: parseInt(row.stock) || 1,  // <-- Aquí leemos "stock" y si no existe, dejamos 1
    };
    products.push(product);
  })
  .on('end', () => {
    console.log('CSV leído con éxito:', products);

    Product.insertMany(products)
      .then(() => {
        console.log('Productos importados con éxito');
        mongoose.connection.close(); // Cierra la conexión si es un script puntual
      })
      .catch(err => console.error('Error al importar productos:', err));
  });