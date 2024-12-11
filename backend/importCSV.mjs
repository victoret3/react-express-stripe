import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import Product from './src/models/Product.js'; // Agrega .js a la ruta del archivo

mongoose.connect('mongodb://localhost:27017/NaniBoronat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conexión exitosa a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

const products = [];

fs.createReadStream('productos.csv') // Ruta a tu archivo CSV
  .pipe(csv())
  .on('data', (row) => {
    const product = {
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      image: row.image,
    };
    products.push(product);
  })
  .on('end', () => {
    console.log('CSV leído con éxito:', products);

    // Insertar productos en la base de datos
    Product.insertMany(products)
      .then(() => console.log('Productos importados con éxito'))
      .catch(err => console.error('Error al importar productos:', err));
  });
