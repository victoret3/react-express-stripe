// uploadToImgur.mjs
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Coge las credenciales desde .env
const CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const CLIENT_SECRET = process.env.IMGUR_CLIENT_SECRET;

// Carpeta donde están las imágenes
const imagesFolder = path.join(process.cwd(), 'images');

// Función para subir una imagen a Imgur
async function uploadImage(filePath) {
  try {
    // Lee el archivo y conviértelo a base64
    const imageData = fs.readFileSync(filePath, { encoding: 'base64' });

    // Petición POST a la API de Imgur
    const response = await axios.post(
      'https://api.imgur.com/3/image',
      {
        image: imageData,
        type: 'base64',
      },
      {
        headers: {
          Authorization: `Client-ID ${CLIENT_ID}`,
        },
      }
    );

    // Retorna el link directo de la imagen subida
    return response.data.data.link;
  } catch (error) {
    console.error(`Error subiendo "${filePath}": ${error.message}`);
    return null;
  }
}

(async () => {
  try {
    // Lee los archivos de la carpeta 'images' y filtra por extensiones de imagen
    const files = fs.readdirSync(imagesFolder).filter(file =>
      /\.(jpe?g|png|gif|webp)$/i.test(file)
    );

    // Opcional: ordena los archivos para subirlos en secuencia 01, 02, ...
    files.sort();

    console.log('CLIENT_ID:', CLIENT_ID);
    console.log('CLIENT_SECRET:', CLIENT_SECRET ? '**********' : 'No hay secret');

    for (const file of files) {
      const filePath = path.join(imagesFolder, file);
      console.log(`Subiendo: ${file}`);

      const url = await uploadImage(filePath);
      if (url) {
        console.log(`✔️  Subido con éxito: ${url}`);
      } else {
        console.log(`❌ Falló la subida de ${file}`);
      }

      // Añade un retardo de 3 segundos entre subidas para evitar el 503 por saturación
      await new Promise(res => setTimeout(res, 3000));
    }

    console.log('Proceso finalizado.');
  } catch (error) {
    console.error('Error general en el script:', error);
  }
})();