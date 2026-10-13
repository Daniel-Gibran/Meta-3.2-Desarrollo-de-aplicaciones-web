/**
 * Migración: crea la tabla `jugadores`.
 *
 * RN-01 se materializa aquí: el índice UNIQUE sobre `nickname` impide que dos
 * jugadores compartan el mismo apodo, incluso si dos peticiones simultáneas
 * pasan ambas la validación del service.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.createTable('jugadores', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    nickname: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Apodo del jugador en el juego. Debe ser único (RN-01).',
    },
    nombre_real: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    pais: {
      type: Sequelize.STRING(60),
      allowNull: true,
    },
    rol: {
      type: Sequelize.ENUM('Top', 'Jungle', 'Mid', 'ADC', 'Support'),
      allowNull: false,
      comment: 'Rol principal del jugador en el juego.',
    },
    estado: {
      type: Sequelize.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo',
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
  await queryInterface.dropTable('jugadores');
}

export default { up, down };