/**
 * Servicio de asignaciones: gestiona la relación entre un jugador y un roster.
 *
 * Es el módulo con más reglas de negocio de toda la API, y todas se resuelven
 * aquí, en la capa de servicios:
 *
 *   RN-02 — un roster puede tener como máximo 5 titulares.
 *   RN-03 — no puede haber dos titulares con el mismo rol en un roster.
 *   RN-04 — un jugador puede estar en varios rosters.
 *
 * RN-04 no se "implementa" aquí: se materializa en la base de datos con el
 * índice UNIQUE sobre el par (roster_id, jugador_id), que permite repetir
 * jugador entre rosters distintos pero no dentro del mismo.
 */

import { Op } from 'sequelize';

import { Jugador, Roster, RosterJugador } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { MAX_TITULARES } from '../utils/catalogos.js';
import { aJugadorEnRoster } from '../utils/serializar.js';
import { validarAsignacion, validarCambioRol } from '../utils/validaciones.js';

import { contarTitulares, obtenerExistente as obtenerRoster } from './rosters.service.js';

/**
 * Lista los jugadores de un roster.
 *
 * RF-09 y RF-12.
 *
 * @param {number} rosterId Identificador del roster
 * @returns {Promise<object[]>} Jugadores con su rol en el roster
 * @throws {ApiError} 404 si el roster no existe
 */
export async function listarJugadores (rosterId) {
  await obtenerRoster(rosterId);

  const asignaciones = await RosterJugador.findAll({
    where: { roster_id: rosterId },
    include: [{ model: Jugador, as: 'jugador' }],
    order: [[{ model: Jugador, as: 'jugador' }, 'id', 'ASC']],
  });

  return asignaciones.map((a) => ({
    ...aJugadorEnRoster(a.jugador),
    // Se toma el rol del registro de asignación, que es la fuente de verdad:
    // el include podría o no adjuntar el modelo intermedio al jugador.
    rol_en_roster: a.rol_en_roster,
  }));
}

/**
 * Asigna un jugador a un roster.
 *
 * RF-12. Valida en este orden: existencia del roster, existencia del jugador,
 * que no esté ya asignado, y por último las reglas de composición del roster
 * (solo aplican si el jugador entra como Titular).
 *
 * El orden importa: si el jugador se agregaría como sexto titular, es más
 * claro informing de ese conflicto que de que el roster no existe.
 *
 * @param {number} rosterId Identificador del roster
 * @param {object} cuerpo Objeto con `jugador_id` y `rol_en_roster`
 * @returns {Promise<object>} Asignación creada, con el jugador completo
 * @throws {ApiError} 400 datos inválidos, 404 roster o jugador inexistente,
 *                     409 jugador ya asignado o regla RN-02/RN-03 incumplida
 */
export async function asignar (rosterId, cuerpo) {
  const { jugador_id, rol_en_roster } = validarAsignacion(cuerpo);

  // 1. El roster debe existir.
  await obtenerRoster(rosterId);

  // 2. El jugador debe existir (404: el enunciado lo pide así de forma explícita).
  const jugador = await Jugador.findByPk(jugador_id);
  if (!jugador) {
    throw ApiError.notFound(`No existe un jugador con el id ${jugador_id}`);
  }

  // 3. Un jugador no puede estar dos veces en el mismo roster.
  const yaEsta = await RosterJugador.findOne({
    where: { roster_id: rosterId, jugador_id },
  });
  if (yaEsta) {
    throw ApiError.conflict('Ese jugador ya está asignado a este roster', {
      roster_id: rosterId,
      jugador_id,
      rol_en_roster: yaEsta.rol_en_roster,
    });
  }

  // 4. Reglas de composición. Solo aplican al rol Titular.
  if (rol_en_roster === 'Titular') {
    await validarCupoDeTitulares(rosterId);
    await validarRolDuplicado(rosterId, jugador);
  }

  const asignacion = await RosterJugador.create({
    roster_id: rosterId,
    jugador_id,
    rol_en_roster,
  });

  return {
    id: asignacion.id,
    roster_id: rosterId,
    jugador_id,
    rol_en_roster,
    jugador: { ...aJugadorEnRoster(jugador), rol_en_roster },
  };
}

/**
 * Cambia el rol (Titular/Suplente) de un jugador dentro de un roster.
 *
 * Las reglas RN-02 y RN-03 vuelven a comprobarse, porque cambiar a Titular es
 * tan limitante como agregar un titular nuevo. Al contar se excluye al propio
 * jugador: si ya es titular, contarse a sí mismo haría que el quinto titular
 * no pudiera hacer nada, y su propio registro ocuparía un lugar falso en el
 * límite.
 *
 * @param {number} rosterId Identificador del roster
 * @param {number} jugadorId Identificador del jugador
 * @param {object} cuerpo Objeto con `rol_en_roster`
 * @returns {Promise<object>} Asignación actualizada
 * @throws {ApiError} 400 datos inválidos, 404 roster o asignación inexistente,
 *                     409 regla RN-02/RN-03 incumplida
 */
export async function cambiarRol (rosterId, jugadorId, cuerpo) {
  const { rol_en_roster } = validarCambioRol(cuerpo);

  await obtenerRoster(rosterId);

  const asignacion = await RosterJugador.findOne({
    where: { roster_id: rosterId, jugador_id: jugadorId },
  });

  if (!asignacion) {
    throw ApiError.notFound(
      `El jugador con el id ${jugadorId} no está asignado al roster con el id ${rosterId}`
    );
  }

  if (rol_en_roster === 'Titular') {
    const jugador = await Jugador.findByPk(jugadorId);
    // Se excluye al jugador que se está modificando del conteo y de la
    // comprobación de rol duplicado.
    await validarCupoDeTitulares(rosterId, jugadorId);
    await validarRolDuplicado(rosterId, jugador, jugadorId);
  }

  await asignacion.update({ rol_en_roster });

  const jugador = await Jugador.findByPk(jugadorId);

  return {
    id: asignacion.id,
    roster_id: rosterId,
    jugador_id: jugadorId,
    rol_en_roster: asignacion.rol_en_roster,
    jugador: { ...aJugadorEnRoster(jugador), rol_en_roster: asignacion.rol_en_roster },
  };
}

/**
 * Quita un jugador de un roster.
 *
 * RF-13. La fila de la tabla intermedia se elimina; el jugador permanece en el
 * sistema (RN-05), y si era titular el cupo queda libre para otro.
 *
 * @param {number} rosterId Identificador del roster
 * @param {number} jugadorId Identificador del jugador
 * @returns {Promise<void>} Resuelve si la asignación fue eliminada
 * @throws {ApiError} 404 si el roster no existe o el jugador no está asignado
 */
export async function quitar (rosterId, jugadorId) {
  await obtenerRoster(rosterId);

  const eliminadas = await RosterJugador.destroy({
    where: { roster_id: rosterId, jugador_id: jugadorId },
  });

  if (eliminadas === 0) {
    throw ApiError.notFound(
      `El jugador con el id ${jugadorId} no está asignado al roster con el id ${rosterId}`
    );
  }
}

/**
 * Comprueba RN-02: que el roster no haya alcanzado ya el máximo de titulares.
 *
 * @param {number} rosterId Roster a comprobar
 * @param {number|null} [excluirJugadorId] Jugador que no debe contar
 * @throws {ApiError} 409 si el roster ya tiene 5 titulares
 */
async function validarCupoDeTitulares (rosterId, excluirJugadorId = null) {
  const titulares = await contarTitulares(rosterId, excluirJugadorId);

  if (titulares >= MAX_TITULARES) {
    throw ApiError.conflict(
      `El roster ya tiene el máximo de ${MAX_TITULARES} titulares`,
      {
        roster_id: rosterId,
        maximoTitulares: MAX_TITULARES,
        titularesActuales: titulares,
        solucion:
          'Agrega al jugador como Suplente, o quita a un titular antes de agregarlo',
      }
    );
  }
}

/**
 * Comprueba RN-03: que no haya ya otro titular con el mismo rol de juego.
 *
 * En un roster de League of Legends solo puede haber un Mid titular: meter dos
 * sería un equipo imposible. El "rol" que se compara es el del jugador
 * (`jugadores.rol`), no el `rol_en_roster`, porque la regla habla de la
 * posición que ocupa en el juego.
 *
 * @param {number} rosterId Roster a comprobar
 * @param {object|null} jugador Instancia del jugador que se quiere agregar
 * @param {number|null} [excluirJugadorId] Jugador que no debe considerarse
 * @throws {ApiError} 409 si ya hay un titular con el mismo rol
 */
async function validarRolDuplicado (rosterId, jugador, excluirJugadorId = null) {
  if (!jugador) return;

  // La consulta parte de RosterJugador y no de Jugador a propósito: las columnas
  // roster_id y rol_en_roster viven en la tabla intermedia, no en `jugadores`.
  // Consultarlas sobre Jugador produciría un SQL inválido.
  const where = {
    roster_id: rosterId,
    rol_en_roster: 'Titular',
    jugador_id: { [Op.ne]: excluirJugadorId ?? -1 },
  };

  const titulares = await RosterJugador.findAll({
    where,
    attributes: ['jugador_id'],
    include: [{ model: Jugador, as: 'jugador', attributes: ['id', 'nickname', 'rol'] }],
  });

  // El "rol" que se compara es el del jugador en el juego, no el
  // `rol_en_roster`: la regla habla de la posición que ocupa en el juego.
  const conflicto = titulares.find((t) => t.jugador?.rol === jugador.rol);

  if (conflicto) {
    const enConflicto = conflicto.jugador;

    throw ApiError.conflict(
      `El roster ya tiene un titular en el rol ${jugador.rol}`,
      {
        roster_id: rosterId,
        rol: jugador.rol,
        jugadorActual: {
          id: enConflicto.id,
          nickname: enConflicto.nickname,
          rol: enConflicto.rol,
        },
        jugadorNuevo: {
          id: jugador.id,
          nickname: jugador.nickname,
          rol: jugador.rol,
        },
        solucion:
          'Agrega al jugador como Suplente, o libera el rol cambiando al titular actual',
      }
    );
  }
}

export default {
  listarJugadores,
  asignar,
  cambiarRol,
  quitar,
};