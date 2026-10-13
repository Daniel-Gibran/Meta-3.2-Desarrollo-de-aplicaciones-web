/**
 * Controlador de asignaciones.
 *
 * Expone la relación entre jugadores y rosters. Las reglas RN-02 (máximo de 5
 * titulares), RN-03 (un titular por rol) y RN-04 (un jugador puede estar en
 * varios rosters) se aplican en asignaciones.service.js.
 */

import asyncHandler from '../utils/asyncHandler.js';
import aId from '../utils/validarId.js';
import ApiError from '../utils/ApiError.js';
import asignacionesService from '../services/asignaciones.service.js';

/**
 * GET /api/v1/rosters/:id/jugadores
 * Lista los jugadores de un roster. Responde 200 o 404.
 */
export const listarJugadores = asyncHandler(async (req, res) => {
  const jugadores = await asignacionesService.listarJugadores(exigirId(req.params.id, 'roster'));

  res.status(200).json({
    success: true,
    count: jugadores.length,
    data: jugadores,
  });
});

/**
 * POST /api/v1/rosters/:id/jugadores
 * Asigna un jugador al roster. Responde 201, 400, 404 o 409.
 */
export const asignar = asyncHandler(async (req, res) => {
  const rosterId = exigirId(req.params.id, 'roster');

  const asignacion = await asignacionesService.asignar(rosterId, req.body);

  res
    .location(`${req.baseUrl}/${asignacion.jugador_id}`)
    .status(201)
    .json({
      success: true,
      message: `Jugador asignado como ${asignacion.rol_en_roster}`,
      data: asignacion,
    });
});

/**
 * PUT /api/v1/rosters/:id/jugadores/:id_jugador
 * Cambia el rol en el roster. Responde 200, 400, 404 o 409.
 */
export const cambiarRol = asyncHandler(async (req, res) => {
  const rosterId = exigirId(req.params.id, 'roster');
  const jugadorId = exigirId(req.params.id_jugador, 'jugador');

  const asignacion = await asignacionesService.cambiarRol(rosterId, jugadorId, req.body);

  res.status(200).json({
    success: true,
    message: `Rol actualizado a ${asignacion.rol_en_roster}`,
    data: asignacion,
  });
});

/**
 * DELETE /api/v1/rosters/:id/jugadores/:id_jugador
 * Quita un jugador del roster. Responde 204 o 404.
 */
export const quitar = asyncHandler(async (req, res) => {
  const rosterId = exigirId(req.params.id, 'roster');
  const jugadorId = exigirId(req.params.id_jugador, 'jugador');

  await asignacionesService.quitar(rosterId, jugadorId);

  res.status(204).end();
});

/**
 * Convierte un id de la ruta en entero o responde 400.
 *
 * @param {string} valor Id crudo de req.params
 * @param {string} nombre Nombre del parámetro, usado en el mensaje de error
 * @returns {number} Id válido
 * @throws {ApiError} 400 si el id no es un entero positivo
 */
function exigirId (valor, nombre) {
  const id = aId(valor);

  if (id === null) {
    throw ApiError.badRequest(`El ${nombre} debe ser un número entero positivo`, {
      [nombre]: `Valor recibido: "${valor}"`,
    });
  }

  return id;
}

export default {
  listarJugadores,
  asignar,
  cambiarRol,
  quitar,
};