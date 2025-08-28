// Carga las variables de entorno para el desarrollo local
require('dotenv').config();

// Importa nuestra aplicación principal desde index.js
const app = require('./index.js');

// Define el puerto para el desarrollo local
const PORT = process.env.PORT || 5000;

// ¡Aquí está la pieza que faltaba! Le decimos a la app que escuche en el puerto
app.listen(PORT, () => {
  console.log(`🚀 Servidor de DESARROLLO corriendo en http://localhost:${PORT}`);
  console.log('Presiona CTRL+C para detener el servidor.');
});