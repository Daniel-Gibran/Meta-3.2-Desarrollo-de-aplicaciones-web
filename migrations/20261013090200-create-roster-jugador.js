/**
 * Migración: crea la tabla intermedia `roster_jugador`.
 *
 * Es la tabla que representa la relación N:M entre `rosters` y `jugadores`.
 *
 * Decisiones de diseño que quedan fijadas por las reglas de negocio:
 *
 *  RN-04 — un jugador puede estar en varios rosters. Por eso NO hay un
 *          UNIQUE sobre `jugador_id`: el índice único es sobre el PAR
 *          (roster_id, jugador_id), que impide repetir al mismo jugador dos
 *          veces dentro del MISMO roster sin estorbar en los demás.
 *
 *  RN-05 — al eliminar un roster, sus jugadores permanecen en el sistema. La
 *          FK hacia `rosters` usa ON DELETE CASCADE: se borran las filas de la
 *          tabla intermedia, nunca los jugadores.
 *
 *  Jugadores — la FK hacia `jugadores` usa ON DELETE RESTRICT como segunda
 *          línea de defensa: si alguien intenta borrar un jugador que sigue
 *          asignado a un roster, la base de datos lo impide, además del 409
 *          que devuelve la capa de services.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.createTable('roster_jugador', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    roster_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'rosters',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    jugador_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'jugadores',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    rol_en_roster: {
      type: Sequelize.ENUM('Titular', 'Suplente'),
      allowNull: false,
      defaultValue: 'Suplente',
      comment: 'Titular cuenta contra el máximo de 5 (RN-02).',
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  // Un mismo jugador no puede repetirse dentro del mismo roster (RN-04).
  await queryInterface.addIndex('roster_jugador', ['roster_id', 'jugador_id'], {
    name: 'roster_jugador_roster_id_jugador_id_unique',
    unique: true,
  });

  // Índice de apoyo para el filtro más frecuente: listar los titulares de un
  // roster (validación de RN-02).
  await queryInterface.addIndex('roster_jugador', ['roster_id', 'rol_en_roster'], {
    name: 'roster_jugador_roster_id_rol_en_roster',
  });
}

export async function down (queryInterface) {
  await queryInterface.dropTable('roster_jugador');
}

export default { up, down };