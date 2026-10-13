import { DataTypes, Model } from 'sequelize';

import sequelize from '../config/database.js';
import { ROLES_ROSTER } from '../utils/catalogos.js';

/**
 * Modelo RosterJugador: tabla intermedia de la relación N:M entre `rosters` y
 * `jugadores`. Tabla: `roster_jugador`.
 *
 * Existe como modelo propio (y no como configuración oculta de belongsToMany)
 * porque `rol_en_roster` es información del negocio, no un detalle técnico:
 * las reglas RN-02 y RN-03 dependen de ella.
 */
export default class RosterJugador extends Model {
  /**
   * Relaciones del modelo.
   * @param {object} models Todos los modelos ya inicializados
   */
  static associate (models) {
    RosterJugador.belongsTo(models.Roster, {
      foreignKey: 'roster_id',
      as: 'roster',
    });

    RosterJugador.belongsTo(models.Jugador, {
      foreignKey: 'jugador_id',
      as: 'jugador',
    });
  }
}

RosterJugador.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roster_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'rosters', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    jugador_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'jugadores', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    rol_en_roster: {
      type: DataTypes.ENUM(...ROLES_ROSTER),
      allowNull: false,
      defaultValue: 'Suplente',
      validate: {
        isIn: {
          args: [[...ROLES_ROSTER]],
          msg: `El rol en roster debe ser uno de: ${ROLES_ROSTER.join(', ')}`,
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'RosterJugador',
    tableName: 'roster_jugador',
    timestamps: true,
    indexes: [
      {
        name: 'roster_jugador_roster_id_jugador_id_unique',
        unique: true,
        fields: ['roster_id', 'jugador_id'],
      },
      {
        name: 'roster_jugador_roster_id_rol_en_roster',
        fields: ['roster_id', 'rol_en_roster'],
      },
    ],
  }
);