/**
 * Convierte los `id` de los parámetros de ruta en enteros.
 *
 * Devolver `null` en lugar de lanzar el error permite que el controlador
 * responda con el 400 y su mensaje, en vez de propagar la excepción. El
 * patrón es: "si no puedo obtener el id, no sigas; pero el 400 lo decide el
 * controlador, que es quien habla con el cliente".
 */

/**
 * @param {string} valor Valor crudo del parámetro de ruta
 * @returns {number|null} El entero, o null si no es un entero válido
 */
export function aId (valor) {
  // ^\d+$ evita el caso `parseInt('12abc') === 12`, que aceptaría basura.
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export default aId;