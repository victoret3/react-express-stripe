import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/NaniBoronat');
    console.log('MongoDB conectado correctamente');
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    // En Serverless NO hacemos process.exit(1)
  }
};

// (Opcional) Logs de conexión
mongoose.connection.on('connected', () => {
  console.log('Mongoose está conectado');
});
mongoose.connection.on('error', (err) => {
  console.error(`Error en la conexión de Mongoose: ${err}`);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose se ha desconectado');
});

export default connectDB;