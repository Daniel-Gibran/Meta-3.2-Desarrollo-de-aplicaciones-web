/**
 * Punto de entrada de la aplicación.
 *
 * Antes de aceptar peticiones se verifica la conexión con la base de datos.
 * Un servidor que arranca sin conexión es peor que uno que se niega a
 * arrancar: parece que funciona y falla en la primera petición real, con un
 * error 500 difícil de interpretar.
 */

import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

async function iniciar () {
  try {
    await sequelize.authenticate();
    console.log(`✔ Conexión con la base de datos "${sequelize.config.database}" establecida`);
  } catch (error) {
    console.error('✖ No se pudo conectar con la base de datos:', error.message);
    console.error('  Revisa que MySQL esté corriendo y que el archivo .env sea correcto.');
    console.error('  Si es la primera vez, ejecuta:  mysql -u root -p < db/setup.sql');
    process.exit(1);
  }

  const servidor = app.listen(PORT, () => {
    console.log('');
    console.log('  🚀 API de Jugadores y Rosters');
    console.log(`  Servidor:    http://localhost:${PORT}`);
    console.log(`  Swagger UI:  http://localhost:${PORT}/docs`);
    console.log(`  Health check:http://localhost:${PORT}/api/v1/health`);
    console.log('');
  });

  // Cierre ordenado: sin esto, nodemon reiniciaría el proceso sin terminar
  // las conexiones y MySQL terminaría con conexiones colgadas.
  const cerrar = (senal) => {
    console.log(`\n${senal} recibido, cerrando el servidor...`);
    servidor.close(async () => {
      await sequelize.close();
      console.log('✔ Conexión con la base de datos cerrada');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => cerrar('SIGINT'));
  process.on('SIGTERM', () => cerrar('SIGTERM'));
}

iniciar();