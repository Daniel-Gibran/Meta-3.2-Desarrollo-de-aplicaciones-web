/**
 * Catálogos de valores permitidos por la API.
 *
 * Estos son la única fuente de verdad de los valores válidos. El endpoint
 * `GET /api/v1/roles` los expone para que el cliente no tenga que adivinarlos,
 * y los services los usan para validar antes de tocar la base de datos.
 *
 * Los ENUM de MySQL replican estos mismos valores a nivel de tabla (ver las
 * migraciones). La validación aquí es la primera línea —devuelve 400 con un
 * mensaje claro— y el ENUM es la segunda, que impide datos sucios aunque
 * alguien se salte el service.
 */

/** Roles principales de un jugador (columna `jugadores.rol`). */
export const ROLES = Object.freeze(['Top', 'Jungle', 'Mid', 'ADC', 'Support']);

/** Estados posibles de un jugador (columna `jugadores.estado`). */
export const ESTADOS = Object.freeze(['activo', 'inactivo']);

/** Tipos de roster (columna `rosters.tipo`). */
export const TIPOS_ROSTER = Object.freeze(['Principal', 'Academy']);

/** Rol que ocupa un jugador DENTRO de un roster (columna `roster_jugador.rol_en_roster`). */
export const ROLES_ROSTER = Object.freeze(['Titular', 'Suplente']);

/** RN-02: máximo de titulares por roster. */
export const MAX_TITULARES = 5;

/** Juego por defecto de un roster si el cliente no lo envía. */
export const JUEGO_POR_DEFECTO = 'League of Legends';

/**
 * Comprueba si un valor pertenece a un catálogo.
 *
 * @param {string} valor Valor recibido del cliente
 * @param {readonly string[]} catalogo Catálogo contra el que validar
 * @returns {boolean} true si el valor es válido
 */
export function esValorValido (valor, catalogo) {
  return typeof valor === 'string' && catalogo.includes(valor);
}