/**
 * Controlador de endpoints auxiliares.
 *
 * Son los endpoints de apoyo que el enunciado define en la sección 6.4:
 * exponer los catálogos válidos y un health check. Existen para que un
 * cliente no tenga que adivinar qué valores puede enviar, y para comprobar
 * que la API está viva y respondiendo.
 *
 * Los valores salen de src/utils/catalogos.js, que es la misma fuente que usan
 * los services para validar: así nunca pueden desincronizarse.
 */

import asyncHandler from '../utils/asyncHandler.js';
import { sequelize } from '../models/index.js';
import {
  ESTADOS,
  JUEGO_POR_DEFECTO,
  MAX_TITULARES,
  ROLES,
  ROLES_ROSTER,
  TIPOS_ROSTER,
} from '../utils/catalogos.js';

/**
 * GET /api/v1/roles
 * Lista los roles de juego válidos. Responde 200.
 */
export const listarRoles = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    count: ROLES.length,
    data: ROLES,
  });
});

/**
 * GET /api/v1/estados
 * Lista los estados válidos de un jugador. Responde 200.
 */
export const listarEstados = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    count: ESTADOS.length,
    data: ESTADOS,
  });
});

/**
 * GET /api/v1/tipos-roster
 * Lista los tipos de roster válidos. Responde 200.
 */
export const listarTiposRoster = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    count: TIPOS_ROSTER.length,
    data: TIPOS_ROSTER,
  });
});

/**
 * GET /api/v1/health
 * Comprueba que la API está activa y que la base de datos responde.
 *
 * No es un simple "vivo": ejecuta SELECT 1 contra la base. Un servidor que
 * arranca pero no puede conectarse a MySQL debería reportarse como caído, y
 * este endpoint es justamente el que se consulta para saberlo.
 *
 * Responde 200 si todo está bien, 503 si la base no responde.
 */
export const health = asyncHandler(async (_req, res) => {
  const inicio = Date.now();
  let baseDeDatos = 'desconocido';

  try {
    await sequelize.query('SELECT 1');
    baseDeDatos = 'conectada';
  } catch (error) {
    // El health check responde 503, no 500: el problema no es un error del
    // código de la API sino que su dependencia no está disponible.
    return res.status(503).json({
      success: false,
      status: 'degradado',
      baseDeDatos: 'sin_conexion',
      mensaje: 'La API está activa pero la base de datos no responde',
    });
  }

  res.status(200).json({
    success: true,
    status: 'activo',
    version: '1.0.0',
    baseDeDatos,
    latenciaMs: Date.now() - inicio,
    reglas: {
      maximoTitularesPorRoster: MAX_TITULARES,
      rolesValidos: ROLES,
      estadosValidos: ESTADOS,
      tiposRosterValidos: TIPOS_ROSTER,
      rolesEnRosterValidos: ROLES_ROSTER,
      juegoPorDefecto: JUEGO_POR_DEFECTO,
    },
  });
});

export default {
  listarRoles,
  listarEstados,
  listarTiposRoster,
  health,
};