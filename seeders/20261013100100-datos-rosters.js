/**
 * Seeder: datos iniciales de rosters.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.bulkInsert('rosters', [
    {
      nombre: 'TL Principal',
      juego: 'League of Legends',
      tipo: 'Principal',
      temporada: '2026',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'TL Academy',
      juego: 'League of Legends',
      tipo: 'Academy',
      temporada: '2026',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down (queryInterface) {
  await queryInterface.bulkDelete('rosters', null, {});
}

export default { up, down };