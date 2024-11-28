import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/NaniBoronat');
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error conectando a MongoDB: ${error.message}`);
    process.exit(1); // Salir si no se puede conectar
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose está conectado');
});

mongoose.connection.on('error', (err) => {
  console.error(`Error en la conexión de Mongoose: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose está desconectado');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Conexión a MongoDB cerrada por la terminación de la aplicación');
  process.exit(0);
});

export default connectDB;
