/**
 * Punto único de acceso a los modelos.
 *
 * Importa cada modelo, registra las relaciones entre ellos y expone la
 * instancia de Sequelize para poder abrir y cerrar la conexión.
 */

import Jugador from './jugador.model.js';
import Roster from './roster.model.js';
import RosterJugador from './rosterJugador.model.js';
import sequelize from '../config/database.js';

const db = {
  Jugador,
  Roster,
  RosterJugador,
  sequelize,
};

// Las relaciones solo pueden declararse cuando todos los modelos ya están
// cargados; por eso se hace en un segundo paso y no al declarar cada modelo.
Jugador.associate(db);
Roster.associate(db);
RosterJugador.associate(db);

export { Jugador, Roster, RosterJugador, sequelize };
export default db;