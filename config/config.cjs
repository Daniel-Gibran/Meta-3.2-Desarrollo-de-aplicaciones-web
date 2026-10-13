// Configuración de Sequelize para sequelize-cli y para la aplicación.
//
// Se escribe en CommonJS a propósito: sequelize-cli carga este archivo con
// require(), y el package.json raíz declara "type": "module". Un config.js
// en ESM no sería cargable por la CLI.
//
// Los valores vienen de variables de entorno (archivo .env) y nunca se escriben
// aquí: el repositorio queda limpio y cambiar de servidor no toca el código.

require('dotenv').config();

/**
 * Construye el bloque de configuración de un entorno a partir de las variables
 * de entorno. `esTest` permite apuntar a una base separada para pruebas.
 *
 * @param {string} nombreBase  Base de datos del entorno
 * @returns {object} Objeto de configuración compatible con Sequelize
 */
function bloqueConfig (nombreBase) {
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: nombreBase,
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  };
}

module.exports = {
  development: bloqueConfig(process.env.DB_NAME || 'esports'),
  test: bloqueConfig(`${process.env.DB_NAME || 'esports'}_test`),
  production: bloqueConfig(process.env.DB_NAME || 'esports'),
};