/**
 * Instancia única de Sequelize.
 *
 * Se separa en su propio módulo porque tanto los modelos como la aplicación
 * necesitan exactamente la misma conexión. Si cada uno creara la suya, la app
 * y los modelos hablarían con conexiones distintas.
 *
 * Las credenciales nunca se escriben aquí: vienen de config/config.cjs, que a
 * su vez las lee de las variables de entorno del archivo .env.
 */

import 'dotenv/config';
import { Sequelize } from 'sequelize';

import config from '../../config/config.cjs';

const entorno = process.env.NODE_ENV || 'development';
const ajustes = config[entorno];

export const sequelize = new Sequelize(
  ajustes.database,
  ajustes.username,
  ajustes.password,
  {
    host: ajustes.host,
    port: ajustes.port,
    dialect: ajustes.dialect,
    logging: ajustes.logging,
    define: {
      // Las claves foráneas deben existir para que MySQL ejecute ON DELETE
      // CASCADE / RESTRICT. Sin esto Sequelize las omite.
      foreignKeys: true,
    },
  }
);

export default sequelize;