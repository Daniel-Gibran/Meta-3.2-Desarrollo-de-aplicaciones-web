/**
 * Servicio de jugadores.
 *
 * Capa donde viven las reglas de negocio del módulo. No conoce Express: no
 * recibe `req` ni `res` y tampoco elige códigos de estado HTTP. Cuando algo
 * está mal lanza un `ApiError` describiendo el problema, y es el middleware
 * de errores quien lo traduce a una respuesta.
 *
 * Reglas de negocio que aplica este módulo:
 *   RN-01 — el nickname de un jugador debe ser único.
 */

import { Op } from 'sequelize';

import { Jugador, RosterJugador } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { aJugador } from '../utils/serializar.js';
import { validarFiltrosJugadores, validarJugador } from '../utils/validaciones.js';

/**
 * Lista jugadores, opcionalmente filtrados por rol, estado o nombre.
 *
 * RF-02 y RF-06.
 *
 * @param {object} [query] Parámetros de consulta
 * @returns {Promise<object[]>} Lista de jugadores serializados
 */
export async function listar (query = {}) {
  const filtros = validarFiltrosJugadores(query);
  const where = {};

  if (filtros.rol !== undefined) where.rol = filtros.rol;
  if (filtros.estado !== undefined) where.estado = filtros.estado;
  if (filtros.search !== undefined) {
    // La collation de MySQL es case-insensitive, así que LIKE ya cubre la
    // búsqueda sin distinguir mayúsculas sin necesidad de LOWER().
    where.nickname = { [Op.like]: `%${filtros.search}%` };
  }

  const jugadores = await Jugador.findAll({
    where,
    order: [['id', 'ASC']],
  });

  return jugadores.map(aJugador);
}

/**
 * Obtiene un jugador por su identificador.
 *
 * RF-03.
 *
 * @param {number} id Identificador del jugador
 * @returns {Promise<object>} Jugador serializado
 * @throws {ApiError} 404 si no existe
 */
export async function obtenerPorId (id) {
  const jugador = await Jugador.findByPk(id);

  if (!jugador) {
    throw ApiError.notFound(`No existe un jugador con el id ${id}`);
  }

  return aJugador(jugador);
}

/**
 * Crea un jugador nuevo.
 *
 * RF-01 y RN-01.
 *
 * @param {object} cuerpo Datos del jugador
 * @returns {Promise<object>} Jugador creado y serializado
 * @throws {ApiError} 400 si los datos no son válidos, 409 si el nickname ya existe
 */
export async function crear (cuerpo) {
  const datos = validarJugador(cuerpo);

  await asegurarNicknameLibre(datos.nickname, null);

  const jugador = await Jugador.create(datos);
  return aJugador(jugador);
}

/**
 * Actualiza un jugador existente.
 *
 * RF-04 y RN-01. El PUT es un reemplazo total: el cuerpo debe traer todos los
 * campos obligatorios, y los opcionales que no lleguen se reponen con su valor
 * por defecto. Es la semántica de HTTP, donde PUT significa "el recurso es
 * exactamente esto".
 *
 * @param {number} id Identificador del jugador
 * @param {object} cuerpo Datos completos del jugador
 * @returns {Promise<object>} Jugador actualizado y serializado
 * @throws {ApiError} 400 si los datos no son válidos, 404 si no existe, 409 si el nickname está tomado
 */
export async function actualizar (id, cuerpo) {
  const datos = validarJugador(cuerpo);

  await obtenerExistente(id);
  await asegurarNicknameLibre(datos.nickname, id);

  const [afectadas] = await Jugador.update(datos, { where: { id } });
  if (afectadas === 0) {
    throw ApiError.notFound(`No existe un jugador con el id ${id}`);
  }

  const jugador = await Jugador.findByPk(id);
  return aJugador(jugador);
}

/**
 * Elimina un jugador.
 *
 * RF-05. Si el jugador está asignado a algún roster la operación se rechaza
 * con 409: el jugador no se borra y el cliente debe quitarlo primero de sus
 * rosters con DELETE /rosters/{id}/jugadores/{id_jugador}.
 *
 * La decisión protege al cliente de un borrado accidental con consecuencias en
 * varias plantillas, y deja el estado consistente en lugar de dejar huecos
 * que después alguien tendría que reconstruir a mano.
 *
 * @param {number} id Identificador del jugador
 * @returns {Promise<void>} Resuelve si el jugador fue eliminado
 * @throws {ApiError} 404 si no existe, 409 si tiene asignaciones
 */
export async function eliminar (id) {
  await obtenerExistente(id);

  const rosters = await RosterJugador.findAll({
    where: { jugador_id: id },
    attributes: ['roster_id'],
  });

  if (rosters.length > 0) {
    throw ApiError.conflict(
      'El jugador está asignado a uno o más rosters y no puede eliminarse',
      {
        jugador_id: id,
        rostersIds: rosters.map((r) => r.roster_id),
        solucion:
          'Quita al jugador de cada roster con DELETE /rosters/{id}/jugadores/{id_jugador} e inténtalo de nuevo',
      }
    );
  }

  const eliminados = await Jugador.destroy({ where: { id } });

  if (eliminados === 0) {
    throw ApiError.notFound(`No existe un jugador con el id ${id}`);
  }
}

/**
 * Comprueba que un jugador exista, y lanza 404 si no.
 *
 * Los services reutilizan este método en vez de repetir el `findByPk` con su
 * `if (!jugador) throw`: la comprobación es idéntica en todos los casos.
 *
 * @param {number} id Identificador del jugador
 * @returns {Promise<object>} Instancia del modelo Jugador
 * @throws {ApiError} 404 si no existe
 */
export async function obtenerExistente (id) {
  const jugador = await Jugador.findByPk(id);

  if (!jugador) {
    throw ApiError.notFound(`No existe un jugador con el id ${id}`);
  }

  return jugador;
}

/**
 * Verifica que el nickname no esté registrado en otro jugador (RN-01).
 *
 * `idExcluido` permite que la comprobación omita al propio jugador cuando se
 * está actualizando: si el nickname no cambió, no debe entrar en conflicto
 * consigo mismo.
 *
 * @param {string} nickname Nickname a comprobar
 * @param {number|null} idExcluido Id del jugador que se está actualizando
 * @throws {ApiError} 409 si el nickname ya pertenece a otro jugador
 */
async function asegurarNicknameLibre (nickname, idExcluido) {
  const where = { nickname };

  if (idExcluido !== null && idExcluido !== undefined) {
    where.id = { [Op.ne]: idExcluido };
  }

  const existente = await Jugador.findOne({ where, attributes: ['id'] });

  if (existente) {
    throw ApiError.conflict('Ya existe un jugador registrado con ese nickname', {
      nickname,
      jugador_id: existente.id,
    });
  }
}

export default {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  obtenerExistente,
};