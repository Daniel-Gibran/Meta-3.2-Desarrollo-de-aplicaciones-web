/**
 * Controlador de rosters.
 *
 * Traduce peticiones a llamadas al service y decide el código de estado.
 * Las reglas RN-02, RN-03 y RN-05 viven en los servicios, no aquí.
 */

import asyncHandler from '../utils/asyncHandler.js';
import aId from '../utils/validarId.js';
import ApiError from '../utils/ApiError.js';
import rostersService from '../services/rosters.service.js';

/**
 * GET /api/v1/rosters
 * Lista todos los rosters con su cantidad de jugadores. Admite ?tipo y
 * ?temporada. Responde 200.
 */
export const listar = asyncHandler(async (req, res) => {
  const rosters = await rostersService.listar(req.query);

  res.status(200).json({
    success: true,
    count: rosters.length,
    data: rosters,
  });
});

/**
 * GET /api/v1/rosters/:id
 * Detalle de un roster, con la lista de jugadores asignados y su rol.
 * Responde 200 o 404.
 */
export const obtenerPorId = asyncHandler(async (req, res) => {
  const roster = await rostersService.obtenerPorId(exigirId(req.params.id));

  res.status(200).json({ success: true, data: roster });
});

/**
 * POST /api/v1/rosters
 * Crea un roster. Responde 201 o 400.
 */
export const crear = asyncHandler(async (req, res) => {
  const roster = await rostersService.crear(req.body);

  res.location(`${req.baseUrl}/${roster.id}`).status(201).json({
    success: true,
    message: 'Roster creado exitosamente',
    data: roster,
  });
});

/**
 * PUT /api/v1/rosters/:id
 * Actualiza un roster (reemplazo total). Responde 200, 400 o 404.
 */
export const actualizar = asyncHandler(async (req, res) => {
  const roster = await rostersService.actualizar(exigirId(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Roster actualizado exitosamente',
    data: roster,
  });
});

/**
 * DELETE /api/v1/rosters/:id
 * Elimina un roster. Responde 204 o 404.
 *
 * Los jugadores del roster no se eliminan (RN-05); solo se borran las filas
 * que los vinculaban a este roster.
 */
export const eliminar = asyncHandler(async (req, res) => {
  await rostersService.eliminar(exigirId(req.params.id));

  res.status(204).end();
});

/**
 * Convierte el id de la ruta en entero o responde 400.
 *
 * @param {string} valor Id crudo de req.params
 * @returns {number} Id válido
 * @throws {ApiError} 400 si el id no es un entero positivo
 */
function exigirId (valor) {
  const id = aId(valor);

  if (id === null) {
    throw ApiError.badRequest('El id debe ser un número entero positivo', {
      id: `Valor recibido: "${valor}"`,
    });
  }

  return id;
}

export default {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};