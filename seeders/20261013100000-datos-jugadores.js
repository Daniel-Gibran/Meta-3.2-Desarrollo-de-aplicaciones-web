/**
 * Seeder: datos iniciales de jugadores.
 *
 * Cubre los cinco roles del juego para que las pruebas de las reglas de
 * negocio tengan con qué trabajar sin tener que crear jugadores a mano.
 * Los nombres de tabla deben coincidir EXACTAMENTE con los de las
 * migraciones: en MySQL sobre Linux `Jugadores` y `jugadores` son tablas
 * distintas.
 */

export async function up (queryInterface, Sequelize) {
  await queryInterface.bulkInsert('jugadores', [
    {
      nickname: 'Faker',
      nombre_real: 'Lee Sang-hyeok',
      pais: 'Corea del Sur',
      rol: 'Mid',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'Impact',
      nombre_real: 'Song Eui-jin',
      pais: 'Corea del Sur',
      rol: 'Support',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'CuVee',
      nombre_real: 'Jang Seon-hyeon',
      pais: 'Corea del Sur',
      rol: 'Jungle',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'Licorice',
      nombre_real: 'Tan Rin',
      pais: 'Singapur',
      rol: 'Top',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'CoreJJ',
      nombre_real: 'Jo Yun-hyeop',
      pais: 'Estados Unidos',
      rol: 'Support',
      estado: 'inactivo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'Aatrox',
      nombre_real: 'Loïc Tanaka',
      pais: 'Francia',
      rol: 'Top',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nickname: 'Elyoya',
      nombre_real: 'Elyoya Bou',
      pais: 'Francia',
      rol: 'ADC',
      estado: 'activo',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down (queryInterface) {
  await queryInterface.bulkDelete('jugadores', null, {});
}

export default { up, down };