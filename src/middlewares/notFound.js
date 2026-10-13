/**
 * Middleware de ruta no encontrada.
 *
 * Se registra DESPUÉS de todas las rutas de la API. Si ninguna coincidió,
 * significa que el cliente pidió un endpoint que no existe: 404.
 *
 * Sin él, Express dejaría la petición sin respuesta cuando no hay ninguna
 * ruta que la atienda.
 */

/**
 * @type {import('express').RequestHandler}
 */
export function notFound (req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export default notFound;