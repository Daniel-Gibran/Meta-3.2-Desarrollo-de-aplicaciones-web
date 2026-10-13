/**
 * Controlador de jugadores.
 *
 * Su trabajo es únicamente de traducción: extrae lo que hay en la petición,
 * llama al service y decide el código de estado de la respuesta. Ninguna
 * regla de negocio vive aquí: si el service no falla, el controlador no
 * invalida nada.
 */

import asyncHandler from '../utils/asyncHandler.js';
import aId from '../utils/validarId.js';
import ApiError from '../utils/ApiError.js';
import jugadoresService from '../services/jugadores.service.js';

/**
 * GET /api/v1/jugadores
 * Lista todos los jugadores. Admite ?rol, ?estado y ?search.
 * Responde 200.
 */
export const listar = asyncHandler(async (req, res) => {
  const jugadores = await jugadoresService.listar(req.query);

  res.status(200).json({
    success: true,
    count: jugadores.length,
    data: jugadores,
  });
});

/**
 * GET /api/v1/jugadores/:id
 * Detalle de un jugador. Responde 200 o 404.
 */
export const obtenerPorId = asyncHandler(async (req, res) => {
  const jugador = await jugadoresService.obtenerPorId(exigirId(req.params.id));

  res.status(200).json({ success: true, data: jugador });
});

/**
 * POST /api/v1/jugadores
 * Crea un jugador. Responde 201, 400 o 409 (nickname repetido).
 */
export const crear = asyncHandler(async (req, res) => {
  const jugador = await jugadoresService.crear(req.body);

  // La cabecera Location indica dónde está el recurso recién creado, que es
  // justo lo que aporta el 201 además del cuerpo.
  res.location(`${req.baseUrl}/${jugador.id}`).status(201).json({
    success: true,
    message: 'Jugador creado exitosamente',
    data: jugador,
  });
});

/**
 * PUT /api/v1/jugadores/:id
 * Actualiza un jugador (reemplazo total). Responde 200, 400, 404 o 409.
 */
export const actualizar = asyncHandler(async (req, res) => {
  const jugador = await jugadoresService.actualizar(exigirId(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Jugador actualizado exitosamente',
    data: jugador,
  });
});

/**
 * DELETE /api/v1/jugadores/:id
 * Elimina un jugador. Responde 204, 404 o 409 (si está en algún roster).
 *
 * El 204 significa "sin contenido": la respuesta no lleva cuerpo, no un
 * `{}` vacío. Se llama a `res.end()` para que Express no añada nada.
 */
export const eliminar = asyncHandler(async (req, res) => {
  await jugadoresService.eliminar(exigirId(req.params.id));

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