/**
 * Servicio de rosters.
 *
 * Como el de jugadores, no conoce Express: lanza `ApiError` y deja que el
 * middleware traduzca a códigos HTTP.
 *
 * Reglas de negocio que aplica este módulo:
 *   RN-05 — al eliminar un roster, los jugadores permanecen en el sistema.
 *           Aquí solo se borra el roster; las filas de la tabla intermedia se
 *           van solas por ON DELETE CASCADE, y los jugadores no se tocan.
 */

import { Op } from 'sequelize';

import { Jugador, Roster, RosterJugador } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { aRoster, aRosterResumen, aJugadorEnRoster } from '../utils/serializar.js';
import { validarFiltrosRosters, validarRoster } from '../utils/validaciones.js';

/**
 * Lista rosters con la cantidad de jugadores y de titulares que contiene cada
 * uno.
 *
 * RF-08 y RF-06 (filtro por tipo y temporada).
 *
 * @param {object} [query] Parámetros de consulta
 * @returns {Promise<object[]>} Lista de rosters serializados
 */
export async function listar (query = {}) {
  const filtros = validarFiltrosRosters(query);
  const where = {};

  if (filtros.tipo !== undefined) where.tipo = filtros.tipo;
  if (filtros.temporada !== undefined) where.temporada = filtros.temporada;

  const rosters = await Roster.findAll({
    where,
    order: [['id', 'ASC']],
    include: [
      {
        // Se cargan solo dos campos: el id del jugador y su rol en el roster.
        // `rol_en_roster` SÍ hace falta aquí, porque es con el que se calcula
        // `cantidadTitulares`; cargarlo vacío haría que el conteo fuera 0.
        model: Jugador,
        as: 'jugadores',
        attributes: ['id'],
        through: { attributes: ['rol_en_roster'] },
      },
    ],
  });

  return rosters.map(aRosterResumen);
}

/**
 * Obtiene un roster con la lista de jugadores asignados.
 *
 * RF-09. Cada jugador incluye su `rol` (el del juego) y su `rol_en_roster`
 * (Titular o Suplente), que son cosas distintas: un Suplente de Mid sigue
 * siendo Mid en el roster, solo que no juega de titular.
 *
 * @param {number} id Identificador del roster
 * @returns {Promise<object>} Roster con su lista de jugadores
 * @throws {ApiError} 404 si no existe
 */
export async function obtenerPorId (id) {
  const roster = await Roster.findByPk(id, {
    include: [
      {
        model: Jugador,
        as: 'jugadores',
        through: { attributes: ['rol_en_roster'] },
      },
    ],
  });

  if (!roster) {
    throw ApiError.notFound(`No existe un roster con el id ${id}`);
  }

  return {
    ...aRoster(roster),
    jugadores: (roster.jugadores ?? [])
      .map(aJugadorEnRoster)
      .sort((a, b) => a.id - b.id),
  };
}

/**
 * Crea un roster nuevo.
 *
 * RF-07.
 *
 * @param {object} cuerpo Datos del roster
 * @returns {Promise<object>} Roster creado y serializado
 * @throws {ApiError} 400 si los datos no son válidos
 */
export async function crear (cuerpo) {
  const datos = validarRoster(cuerpo);

  const roster = await Roster.create(datos);
  return aRoster(roster);
}

/**
 * Actualiza un roster existente.
 *
 * RF-10. Reemplazo total, igual que en el servicio de jugadores.
 *
 * @param {number} id Identificador del roster
 * @param {object} cuerpo Datos completos del roster
 * @returns {Promise<object>} Roster actualizado y serializado
 * @throws {ApiError} 400 si los datos no son válidos, 404 si no existe
 */
export async function actualizar (id, cuerpo) {
  const datos = validarRoster(cuerpo);

  const roster = await obtenerExistente(id);

  await roster.update(datos);

  return aRoster(roster);
}

/**
 * Elimina un roster.
 *
 * RF-11 y RN-05. Los jugadores no se eliminan: la base de datos se encarga de
 * borrar únicamente las filas de `roster_jugador` que apuntan a este roster,
 * gracias a ON DELETE CASCADE. Un jugador que estaba solo en este roster pasa
 * a estar simplemente "sin roster", que no es lo mismo que desaparecer.
 *
 * @param {number} id Identificador del roster
 * @returns {Promise<void>} Resuelve si el roster fue eliminado
 * @throws {ApiError} 404 si no existe
 */
export async function eliminar (id) {
  const roster = await obtenerExistente(id);

  await roster.destroy();
}

/**
 * Comprueba que un roster exista, y lanza 404 si no.
 *
 * @param {number} id Identificador del roster
 * @returns {Promise<object>} Instancia del modelo Roster
 * @throws {ApiError} 404 si no existe
 */
export async function obtenerExistente (id) {
  const roster = await Roster.findByPk(id);

  if (!roster) {
    throw ApiError.notFound(`No existe un roster con el id ${id}`);
  }

  return roster;
}

/**
 * Cuenta cuántos titulares tiene un roster, opcionalmente excluyendo a un
 * jugador concreto.
 *
 * El parámetro `excluirJugadorId` es lo que hace que RN-02 funcione al cambiar
 * el rol de un jugador. Sin él, el propio jugador contaría dentro del máximo y
 * un quinto titular no podría ascender: el contador ya lo incluye.
 *
 * @param {number} rosterId Roster a consultar
 * @param {number|null} [excluirJugadorId] Jugador que no debe contar
 * @returns {Promise<number>} Número de titulares
 */
export async function contarTitulares (rosterId, excluirJugadorId = null) {
  const where = {
    roster_id: rosterId,
    rol_en_roster: 'Titular',
  };

  if (excluirJugadorId !== null && excluirJugadorId !== undefined) {
    where.jugador_id = { [Op.ne]: excluirJugadorId };
  }

  return RosterJugador.count({ where });
}

export default {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  obtenerExistente,
  contarTitulares,
};