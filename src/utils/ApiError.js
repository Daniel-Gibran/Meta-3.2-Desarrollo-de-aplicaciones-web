/**
 * Error de aplicación que transporta el código HTTP consigo mismo.
 *
 * ¿Por qué existe esta clase? Porque los services no deben conocer Express:
 * no reciben `req` ni `res` y nunca eligen un código de estado. Lo que sí
 * hacen es fallar de una forma que describa el problema. Esta clase es el
 * puente: el service lanza `ApiError.conflict(...)` y el middleware de errores
 * se limita a traducir ese error a una respuesta HTTP.
 *
 * Si un service empezara a hacer `res.status(409)`, la lógica de negocio
 * quedaría atada al framework y dejaría de poder reutilizarse.
 */
export class ApiError extends Error {
  /**
   * @param {number} status Código de estado HTTP (400, 404, 409, 500...)
   * @param {string} message Mensaje legible para el cliente
   * @param {object} [details] Información adicional opcional (por ejemplo, qué campos fallaron)
   */
  constructor (status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace(this, ApiError);
  }

  /** 400 — la petición está mal formada o incumple una validación. */
  static badRequest (message, details) {
    return new ApiError(400, message, details);
  }

  /** 404 — el recurso solicitado no existe. */
  static notFound (message) {
    return new ApiError(404, message);
  }

  /**
   * 409 — la petición es válida pero choca con el estado actual del sistema:
   * reglas de negocio (RN-01 a RN-05) o recursos que ya existen.
   */
  static conflict (message, details) {
    return new ApiError(409, message, details);
  }

  /** 500 — fallo interno. El middleware lo registra y no filtra detalles. */
  static internal (message = 'Error interno del servidor') {
    return new ApiError(500, message);
  }
}

export default ApiError;