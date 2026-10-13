/**
 * Envuelve un handler asíncrono para que sus rechazos lleguen al middleware
 * de errores.
 *
 * En Express 5 un handler `async` que lanza ya propaga el error solo, pero
 * este envoltorio documenta la intención, protege ante cualquier regresión y
 * evita repetir el `try/catch` en cada uno de los 18 endpoints.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} handler Controlador asíncrono
 * @returns {import('express').RequestHandler} Middleware de Express
 */
export function asyncHandler (handler) {
  return function envuelto (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export default asyncHandler;