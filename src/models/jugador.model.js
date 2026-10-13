import { DataTypes, Model } from 'sequelize';

import sequelize from '../config/database.js';
import { ESTADOS, ROLES } from '../utils/catalogos.js';

/**
 * Modelo Jugador: perfil de un competidor.
 * Tabla: `jugadores`.
 */
export default class Jugador extends Model {
  /**
   * Relaciones del modelo. Las invoca models/index.js una vez cargados todos.
   * @param {object} models Todos los modelos ya inicializados
   */
  static associate (models) {
    // RN-04: la relación es N:M y el intermediario es RosterJugador.
    Jugador.belongsToMany(models.Roster, {
      through: models.RosterJugador,
      as: 'rosters',
      foreignKey: 'jugador_id',
      otherKey: 'roster_id',
    });
  }
}

Jugador.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'El nickname no puede estar vacío',
        },
        len: {
          args: [1, 50],
          msg: 'El nickname debe tener entre 1 y 50 caracteres',
        },
      },
    },
    nombre_real: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pais: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      validate: {
        isIn: {
          args: [[...ROLES]],
          msg: `El rol debe ser uno de: ${ROLES.join(', ')}`,
        },
      },
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: 'activo',
      validate: {
        isIn: {
          args: [[...ESTADOS]],
          msg: `El estado debe ser uno de: ${ESTADOS.join(', ')}`,
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Jugador',
    tableName: 'jugadores',
    timestamps: true,
  }
);