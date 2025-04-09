// uploadToCloudinary.mjs

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Cargar las variables de entorno (.env)
dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

console.log('CLOUD_NAME:', cloudName);
console.log('API_KEY:', apiKey);
console.log('API_SECRET:', apiSecret ? '**********' : 'No hay secreto');

// Carpeta donde guardas tus imágenes (01.jpg, 02.png, etc.)
const imagesFolder = path.join(process.cwd(), 'images');

/**
 * Subir un archivo a Cloudinary.
 *
 * @param {string} filePath - Ruta completa del archivo local
 * @returns {Promise<string|null>} Retorna la URL de la imagen subida, o null si falla
 */
async function uploadToCloudinary(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'naniBoronat', 
      // "folder" es opcional; creará esta carpeta dentro de tu cuenta Cloudinary
      // Si prefieres subir al raíz, quita esta opción.
    });
    // "secure_url" es la URL para ver la imagen de forma pública (HTTPS)
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error al subir "${filePath}": ${error.message}`);
    return null;
  }
}

// Script principal
(async () => {
  try {
    // Leer los archivos de la carpeta "images"
    const files = fs.readdirSync(imagesFolder);

    // Filtrar solo extensiones de imagen
    const imageFiles = files.filter(file => {
      return /\.(jpe?g|png|gif|webp)$/i.test(file);
    });

    // Sube cada imagen una por una
    for (const file of imageFiles) {
      const filePath = path.join(imagesFolder, file);
      console.log(`Subiendo ${file} a Cloudinary...`);

      const url = await uploadToCloudinary(filePath);
      if (url) {
        console.log(`✔️  Subida exitosa: ${url}`);
      } else {
        console.log(`❌ Falló la subida de ${file}`);
      }
    }

    console.log('Proceso completado.');
  } catch (err) {
    console.error('Error en el script:', err);
  }
})();