/**
 * Middleware final: convierte cualquier error en una respuesta JSON con el
 * código de estado correcto.
 *
 * Es el último de la cadena y por eso tiene la firma de cuatro parámetros:
 * Express solo lo reconoce como manejador de errores si recibe `next` después
 * de `res`. Si se le quita, deja de ser un middleware de errores y se convierte
 * en uno normal, que es el error clásico al ordenar esto.
 */

import {
  UniqueConstraintError,
  ValidationError,
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';

import ApiError from '../utils/ApiError.js';

import { ROLES_ROSTER } from '../utils/catalogos.js';

/**
 * Middleware de errores de la aplicación.
 * @type {import('express').ErrorRequestHandler}
 */
export function errorHandler (err, req, res, _next) {
  // 1. Errores previstos: el service ya eligió el código.
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: nombreError(err.status),
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 2. Unicidad violada en la base (carrera entre dos peticiones simultáneas).
  if (err instanceof UniqueConstraintError) {
    const mensaje = mensajeUnicidad(err);
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: mensaje,
    });
  }

  // 3. Validaciones del propio Sequelize.
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Los datos enviados no son válidos',
      details: err.errors.map((e) => ({
        campo: e.path ?? null,
        mensaje: e.message,
      })),
    });
  }

  // 4. Clave foránea: alguien intentó referenciar un registro inexistente.
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: 'La operación viola una restricción de integridad referencial',
    });
  }

  // 5. Cualquier otro error de base de datos.
  if (err instanceof DatabaseError) {
    console.error('[DB]', err.name, err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
    });
  }

  // 6. Errores del middleware que interpreta el cuerpo (body-parser).
  //    Estos ya traen su código HTTP correcto en `err.status`, y respetarlo es
  //    lo que evita que un JSON malformado acabe como 500 en vez de 400, o que
  //    un body demasiado grande acabe como 500 en vez de 413. Sin esta rama,
  //    el 500 se convertiría en la respuesta por defecto y el cliente perdería
  //    la información de qué corregir.
  if (typeof err?.type === 'string' && err.type.startsWith('entity.')) {
    const status = err.status || err.statusCode || 400;

    return res.status(status).json({
      success: false,
      error: nombreError(status),
      message: mensajeBodyParser(status),
    });
  }

  // 7. Fallo genuine e inesperado: se registra completo en el servidor pero
  //    al cliente solo se le da un mensaje genérico, para no filtrar rutas de
  //    archivos, SQL ni estructura interna.
  console.error('[ERROR NO CONTROLADO]', err);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Error interno del servidor',
  });
}

/**
 * Traduce un UniqueConstraintError a un mensaje útil, según la restricción
 * que se violó.
 *
 * @param {UniqueConstraintError} err Error de Sequelize
 * @returns {string} Mensaje en español
 */
function mensajeUnicidad (err) {
  const campos = Object.keys(err?.fields ?? {});
  const texto = campos.join(', ');

  if (campos.includes('nickname')) {
    return 'Ya existe un jugador registrado con ese nickname';
  }
  if (campos.includes('rol_en_roster')) {
    return `El valor enviado para el rol en roster no es válido. Valores permitidos: ${ROLES_ROSTER.join(', ')}`;
  }
  if (campos.includes('roster_id') && campos.includes('jugador_id')) {
    return 'Ese jugador ya está asignado a este roster';
  }
  return texto
    ? `Ya existe un registro con el mismo valor en: ${texto}`
    : 'Ya existe un registro con esos datos';
}

/**
 * Traduce los errores del middleware de cuerpo a un mensaje útil.
 *
 * @param {number} status Código HTTP que body-parser ya asignó
 * @returns {string} Mensaje en español
 */
function mensajeBodyParser (status) {
  const mensajes = {
    400: 'El cuerpo de la petición no es un JSON válido',
    411: 'La petición debe incluir un cuerpo',
    413: 'El cuerpo de la petición supera el límite de 100 KB',
    415: 'La cabecera Content-Type debe ser application/json',
  };

  return mensajes[status] ?? 'No se pudo interpretar el cuerpo de la petición';
}

/**
 * Devuelve el nombre canónico del código de estado HTTP, para que el cliente
 * no tenga que recordarlo.
 *
 * @param {number} status Código HTTP
 * @returns {string} Nombre del estado
 */
function nombreError (status) {
  const nombres = {
    400: 'Bad Request',
    404: 'Not Found',
    409: 'Conflict',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    500: 'Internal Server Error',
  };
  return nombres[status] ?? 'Error';
}

export default errorHandler;