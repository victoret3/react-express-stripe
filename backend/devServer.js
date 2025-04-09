// devServer.js
import dotenv from 'dotenv';
dotenv.config();

import app from './api/index.js'; 
// <-- Ajusta la ruta si tu archivo "serverless" está en "api/index.js"

const PORT = process.env.PORT || 8888;

app.listen(PORT, () => {
  console.log(`\n[Local DEV] Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL (CORS): ${process.env.FRONTEND_URL || '(none set)'}`);
});