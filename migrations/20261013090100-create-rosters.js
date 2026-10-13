/**
 * Migración: crea la tabla `rosters`.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.createTable('rosters', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    juego: {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'League of Legends',
      comment: 'Juego al que corresponde el roster.',
    },
    tipo: {
      type: Sequelize.ENUM('Principal', 'Academy'),
      allowNull: false,
    },
    temporada: {
      type: Sequelize.STRING(10),
      allowNull: false,
      comment: 'Temporada competitiva, por ejemplo "2026".',
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
}

export async function down (queryInterface) {
  await queryInterface.dropTable('rosters');
}

export default { up, down };