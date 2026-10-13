/**
 * Seeder: asignaciones iniciales entre jugadores y rosters.
 *
 * Deja el roster "TL Principal" con 5 titulares y 1 suplente. Cumplir las dos
 * cosas a la vez importa para las pruebas:
 *
 *   - Cinco titulares, que es exactamente el máximo de RN-02, para poder probar
 *     que un sexto es rechazado con 409.
 *   - Cinco roles DISTINTOS (Top, Jungle, Mid, ADC, Support). Meter dos
 *     titulares con el mismo rol violaría RN-03 y dejaría la base de pruebas
 *     inconsistente desde el arranque.
 *
 * CoreJJ (Support) queda fuera del roster: es el jugador que usan las pruebas
 * para provocar los conflictos de RN-02 y RN-03.
 *
 * Los ids se resuelven por nombre en vez de asumirlos, porque los ids
 * autoincrementales dependen del estado previo de la base y no hay garantía de
 * que un jugador sea siempre el id 1.
 */

export async function up (queryInterface) {
  // sequelize.query() devuelve [resultados, metadatos], así que se desestructura
  // la primera posición para quedarse con las filas.
  const [rosterRows] = await queryInterface.sequelize.query(
    "SELECT id FROM rosters WHERE nombre = 'TL Principal'"
  );
  const rosterId = rosterRows[0].id;

  const [jugadores] = await queryInterface.sequelize.query(`
    SELECT
       MAX(CASE WHEN nickname = 'Faker'    THEN id END) AS faker,
       MAX(CASE WHEN nickname = 'Impact'   THEN id END) AS impact,
       MAX(CASE WHEN nickname = 'CuVee'    THEN id END) AS cuvee,
       MAX(CASE WHEN nickname = 'Licorice' THEN id END) AS licorice,
       MAX(CASE WHEN nickname = 'Aatrox'   THEN id END) AS aatrox,
       MAX(CASE WHEN nickname = 'Elyoya'   THEN id END) AS elyoya
     FROM jugadores`
  );

  const id = jugadores[0];
  const ahora = new Date();

  await queryInterface.bulkInsert('roster_jugador', [
    // Titulares: un jugador por cada rol del juego, para que RN-03 se cumpla.
    { roster_id: rosterId, jugador_id: id.licorice, rol_en_roster: 'Titular', createdAt: ahora, updatedAt: ahora },
    { roster_id: rosterId, jugador_id: id.cuvee, rol_en_roster: 'Titular', createdAt: ahora, updatedAt: ahora },
    { roster_id: rosterId, jugador_id: id.faker, rol_en_roster: 'Titular', createdAt: ahora, updatedAt: ahora },
    { roster_id: rosterId, jugador_id: id.elyoya, rol_en_roster: 'Titular', createdAt: ahora, updatedAt: ahora },
    { roster_id: rosterId, jugador_id: id.impact, rol_en_roster: 'Titular', createdAt: ahora, updatedAt: ahora },
    // Suplente: puede repetir el rol de un titular; no cuenta para RN-02 ni RN-03.
    { roster_id: rosterId, jugador_id: id.aatrox, rol_en_roster: 'Suplente', createdAt: ahora, updatedAt: ahora },
  ]);
}

export async function down (queryInterface) {
  await queryInterface.bulkDelete('roster_jugador', null, {});
}

export default { up, down };