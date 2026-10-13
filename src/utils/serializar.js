/**
 * Funciones de serialización.
 *
 * Los objetos de Sequelize incluyen `createdAt`, `updatedAt` y, cuando se
 * usan asociaciones, los campos crudos de la tabla intermedia (`roster_id`,
 * `jugador_id`). Nada de eso debe viajar al cliente: la API expone un contrato
 * limpio y estable, no la forma de las tablas.
 */

/**
 * Convierte un jugador a su forma pública.
 *
 * @param {object} jugador Instancia de Jugador
 * @returns {object} Objeto plano con solo los campos documentados
 */
export function aJugador (jugador) {
  return {
    id: jugador.id,
    nickname: jugador.nickname,
    nombre_real: jugador.nombre_real ?? null,
    pais: jugador.pais ?? null,
    rol: jugador.rol,
    estado: jugador.estado,
  };
}

/**
 * Convierte un roster a su forma pública.
 *
 * @param {object} roster Instancia de Roster
 * @returns {object} Objeto plano con solo los campos documentados
 */
export function aRoster (roster) {
  return {
    id: roster.id,
    nombre: roster.nombre,
    juego: roster.juego,
    tipo: roster.tipo,
    temporada: roster.temporada,
  };
}

/**
 * Convierte un roster de la lista, que además muestra cuántos jugadores tiene.
 * Es lo que pide RF-08.
 *
 * @param {object} roster Instancia de Roster con la asociación `jugadores` cargada
 * @returns {object} Roster con `cantidadJugadores` y `cantidadTitulares`
 */
export function aRosterResumen (roster) {
  const jugadores = roster.jugadores ?? [];
  return {
    ...aRoster(roster),
    cantidadJugadores: jugadores.length,
    cantidadTitulares: jugadores.filter(
      (j) => j.RosterJugador?.rol_en_roster === 'Titular'
    ).length,
  };
}

/**
 * Convierte un jugador dentro de un roster: conserva su identidad y añade el
 * rol que ocupa en esa plantilla concreta, que es el dato propio de la relación.
 *
 * @param {object} jugador Instancia de Jugador con la asociación intermedia
 * @returns {object} Jugador con `rol_en_roster`
 */
export function aJugadorEnRoster (jugador) {
  return {
    id: jugador.id,
    nickname: jugador.nickname,
    nombre_real: jugador.nombre_real ?? null,
    pais: jugador.pais ?? null,
    rol: jugador.rol,
    estado: jugador.estado,
    rol_en_roster: jugador.RosterJugador?.rol_en_roster ?? null,
  };
}