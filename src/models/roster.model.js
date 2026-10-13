import { DataTypes, Model } from 'sequelize';

import sequelize from '../config/database.js';
import { JUEGO_POR_DEFECTO, TIPOS_ROSTER } from '../utils/catalogos.js';

/**
 * Modelo Roster: plantilla de un equipo de eSports para una temporada.
 * Tabla: `rosters`.
 */
export default class Roster extends Model {
  /**
   * Relaciones del modelo.
   * @param {object} models Todos los modelos ya inicializados
   */
  static associate (models) {
    // `as: 'jugadores'` es el alias que usa GET /rosters/{id}. El service
    // Serializa la respuesta y expone los campos de la tabla intermedia
    // (rol_en_roster) con nombreslimpios, sin filtrar roster_id ni jugador_id.
    Roster.belongsToMany(models.Jugador, {
      through: models.RosterJugador,
      as: 'jugadores',
      foreignKey: 'roster_id',
      otherKey: 'jugador_id',
    });
  }
}

Roster.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre del roster no puede estar vacío',
        },
        len: {
          args: [1, 100],
          msg: 'El nombre debe tener entre 1 y 100 caracteres',
        },
      },
    },
    juego: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: JUEGO_POR_DEFECTO,
      validate: {
        notEmpty: {
          msg: 'El juego no puede estar vacío',
        },
      },
    },
    tipo: {
      type: DataTypes.ENUM(...TIPOS_ROSTER),
      allowNull: false,
      validate: {
        isIn: {
          args: [[...TIPOS_ROSTER]],
          msg: `El tipo debe ser uno de: ${TIPOS_ROSTER.join(', ')}`,
        },
      },
    },
    temporada: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        // Se valida con una función que lanza en lugar de con
        // `is: { arg: /^\\d{4}$/ }`. Esa forma está rota en Sequelize 6.37:
        // rechaza el valor aunque coincida con la expresión regular, porque
        // internamente no resuelve el argumento como se espera.
        esAnioDeCuatroDigitos (valor) {
          if (!/^\d{4}$/.test(String(valor))) {
            throw new Error(
              'La temporada debe ser un año de cuatro dígitos, por ejemplo "2026"'
            );
          }
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Roster',
    tableName: 'rosters',
    timestamps: true,
  }
);