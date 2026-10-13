/**
 * Validación y normalización de los datos de entrada.
 *
 * Se separa de los services por una razón concreta: las reglas "qué campos
 * son obligatorios y qué valores aceptan" son las mismas para crear y para
 * actualizar, y repetirlas en dos servicios es la forma más segura de que
 * queden desincronizadas.
 */

import ApiError from './ApiError.js';

import { esValorValido, ESTADOS, ROLES, ROLES_ROSTER, TIPOS_ROSTER } from './catalogos.js';

/**
 * Valida un cuerpo completo (POST o PUT).
 *
 * En ambos verbos el cuerpo debe traer todos los campos obligatorios: el PUT
 * es un reemplazo total del recurso, no una mezcla.
 *
 * @param {object} cuerpo Cuerpo de la petición
 * @returns {object} Datos ya validados y normalizados
 * @throws {ApiError} 400 si falta un campo obligatorio o hay un valor inválido
 */
export function validarJugador (cuerpo) {
  const datos = cuerpo ?? {};
  const errores = {};

  if (esTextoVacio(datos.nickname)) {
    errores.nickname = 'El nickname es obligatorio';
  }
  if (esTextoVacio(datos.rol)) {
    errores.rol = 'El rol es obligatorio';
  } else if (!esValorValido(datos.rol, ROLES)) {
    errores.rol = `El rol debe ser uno de: ${ROLES.join(', ')}`;
  }
  if (datos.estado !== undefined && !esValorValido(datos.estado, ESTADOS)) {
    errores.estado = `El estado debe ser uno de: ${ESTADOS.join(', ')}`;
  }

  // `nombre_real` y `pais` son OPCIONALES: si no llegan, se guardan como null.
  // Solo se rechazan cuando el cliente los manda pero llegan vacíos, porque eso
  // sí es un dato mal formado y no un campo opcional ausente.
  if (datos.nombre_real !== undefined && esTextoVacio(datos.nombre_real)) {
    errores.nombre_real = 'El nombre real no puede estar vacío';
  }
  if (datos.pais !== undefined && esTextoVacio(datos.pais)) {
    errores.pais = 'El país no puede estar vacío';
  }
  if (datos.nickname !== undefined && String(datos.nickname).length > 50) {
    errores.nickname = 'El nickname no puede superar los 50 caracteres';
  }

  if (Object.keys(errores).length > 0) {
    throw ApiError.badRequest('Los datos del jugador no son válidos', errores);
  }

  return {
    nickname: recortar(datos.nickname),
    nombre_real: recortar(datos.nombre_real),
    pais: recortar(datos.pais),
    rol: datos.rol,
    estado: datos.estado ?? 'activo',
  };
}

/**
 * Valida el cuerpo de un roster.
 *
 * @param {object} cuerpo Cuerpo de la petición
 * @returns {object} Datos ya validados y normalizados
 * @throws {ApiError} 400 si falta un campo obligatorio o hay un valor inválido
 */
export function validarRoster (cuerpo) {
  const datos = cuerpo ?? {};
  const errores = {};

  if (esTextoVacio(datos.nombre)) errores.nombre = 'El nombre es obligatorio';
  if (esTextoVacio(datos.tipo)) {
    errores.tipo = 'El tipo es obligatorio';
  } else if (!esValorValido(datos.tipo, TIPOS_ROSTER)) {
    errores.tipo = `El tipo debe ser uno de: ${TIPOS_ROSTER.join(', ')}`;
  }
  if (esTextoVacio(datos.temporada)) {
    errores.temporada = 'La temporada es obligatoria';
  } else if (!/^\d{4}$/.test(String(datos.temporada))) {
    errores.temporada = 'La temporada debe ser un año de cuatro dígitos, por ejemplo "2026"';
  }
  if (datos.juego !== undefined && esTextoVacio(datos.juego)) {
    errores.juego = 'El juego no puede estar vacío';
  }
  if (datos.nombre !== undefined && String(datos.nombre).length > 100) {
    errores.nombre = 'El nombre no puede superar los 100 caracteres';
  }

  if (Object.keys(errores).length > 0) {
    throw ApiError.badRequest('Los datos del roster no son válidos', errores);
  }

  return {
    nombre: recortar(datos.nombre),
    // Si no se envía juego, se aplica el valor por defecto del enunciado.
    juego: recortar(datos.juego) ?? 'League of Legends',
    tipo: datos.tipo,
    temporada: String(datos.temporada),
  };
}

/**
 * Valida el cuerpo de una asignación de jugador a roster.
 *
 * @param {object} cuerpo Cuerpo de la petición
 * @returns {{ jugador_id: number, rol_en_roster: string }} Datos validados
 * @throws {ApiError} 400 si falta un campo o el rol no es válido
 */
export function validarAsignacion (cuerpo) {
  const datos = cuerpo ?? {};
  const errores = {};

  const jugadorId = Number(datos.jugador_id);
  if (datos.jugador_id === undefined || datos.jugador_id === null || datos.jugador_id === '') {
    errores.jugador_id = 'El jugador es obligatorio';
  } else if (!Number.isInteger(jugadorId) || jugadorId <= 0) {
    errores.jugador_id = 'El jugador_id debe ser un número entero positivo';
  }

  if (esTextoVacio(datos.rol_en_roster)) {
    errores.rol_en_roster = 'El rol en roster es obligatorio';
  } else if (!esValorValido(datos.rol_en_roster, ROLES_ROSTER)) {
    errores.rol_en_roster = `El rol en roster debe ser uno de: ${ROLES_ROSTER.join(', ')}`;
  }

  if (Object.keys(errores).length > 0) {
    throw ApiError.badRequest('Los datos de la asignación no son válidos', errores);
  }

  return { jugador_id: jugadorId, rol_en_roster: datos.rol_en_roster };
}

/**
 * Valida el cuerpo de un cambio de rol dentro de un roster.
 *
 * @param {object} cuerpo Cuerpo de la petición
 * @returns {{ rol_en_roster: string }} Dato validado
 * @throws {ApiError} 400 si el rol no es válido
 */
export function validarCambioRol (cuerpo) {
  const rol = cuerpo?.rol_en_roster;

  if (esTextoVacio(rol)) {
    throw ApiError.badRequest('El rol_en_roster es obligatorio', {
      rol_en_roster: 'El rol en roster es obligatorio',
    });
  }
  if (!esValorValido(rol, ROLES_ROSTER)) {
    throw ApiError.badRequest(
      `El rol en roster debe ser uno de: ${ROLES_ROSTER.join(', ')}`,
      { rol_en_roster: `Valores permitidos: ${ROLES_ROSTER.join(', ')}` }
    );
  }

  return { rol_en_roster: rol };
}

/**
 * Valida los parámetros de consulta de GET /jugadores.
 *
 * Un valor de filtro que no pertenece al catálogo se rechaza con 400 en vez
 * de devolver una lista vacía: "no hay jugadores con rol=Capa" es un error
 * del cliente, no un resultado de búsqueda.
 *
 * @param {object} query Objeto req.query
 * @returns {object} Filtros limpios
 * @throws {ApiError} 400 si algún valor de filtro es inválido
 */
export function validarFiltrosJugadores (query) {
  const filtros = {};

  if (query.rol !== undefined) {
    if (!esValorValido(query.rol, ROLES)) {
      throw ApiError.badRequest(`El filtro "rol" solo admite: ${ROLES.join(', ')}`);
    }
    filtros.rol = query.rol;
  }

  if (query.estado !== undefined) {
    if (!esValorValido(query.estado, ESTADOS)) {
      throw ApiError.badRequest(`El filtro "estado" solo admite: ${ESTADOS.join(', ')}`);
    }
    filtros.estado = query.estado;
  }

  if (query.search !== undefined) {
    const termino = String(query.search).trim();
    if (esTextoVacio(termino)) {
      throw ApiError.badRequest('El parámetro "search" no puede estar vacío');
    }
    filtros.search = termino;
  }

  return filtros;
}

/**
 * Valida los parámetros de consulta de GET /rosters.
 *
 * @param {object} query Objeto req.query
 * @returns {object} Filtros limpios
 * @throws {ApiError} 400 si algún valor de filtro es inválido
 */
export function validarFiltrosRosters (query) {
  const filtros = {};

  if (query.tipo !== undefined) {
    if (!esValorValido(query.tipo, TIPOS_ROSTER)) {
      throw ApiError.badRequest(`El filtro "tipo" solo admite: ${TIPOS_ROSTER.join(', ')}`);
    }
    filtros.tipo = query.tipo;
  }

  if (query.temporada !== undefined) {
    if (!/^\d{4}$/.test(String(query.temporada))) {
      throw ApiError.badRequest(
        'El filtro "temporada" debe ser un año de cuatro dígitos, por ejemplo "2026"'
      );
    }
    filtros.temporada = String(query.temporada);
  }

  return filtros;
}

/**
 * Comprueba si un valor es undefined, null o un texto vacío.
 *
 * @param {*} valor Valor a comprobar
 * @returns {boolean} true si está vacío
 */
function esTextoVacio (valor) {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

/**
 * Normaliza un texto: recorta espacios sobrantes.
 *
 * @param {*} valor Valor de entrada
 * @returns {string|null} Texto recortado, o null si estaba vacío
 */
function recortar (valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}