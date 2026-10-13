/**
 * Enrutador raíz de la API v1.
 *
 * Aquí se ve una decisión de orden que no es arbitraria:
 *
 * `auxiliares.routes.js` se registra ANTES que `rosters.routes.js`. Ambas
 * viven bajo /api/v1, pero si se invirtiera, Express haría match con
 * `rosters.routes.js` al recibir `/roles`: el patrón `/:id` de ese router
 * aceptaría "roles" como si fuera un id de roster, y la respuesta sería
 * 400 en lugar del catálogo de roles.
 *
 * Es el mismo problema que se resolvió en Meta 3.1 con `/buscar` antes de
 * `/:id`, y por la misma razón: Express evalúa las rutas en el orden en que
 * se declararon y se detiene en la primera que coincide.
 */

import { Router } from 'express';

import jugadoresRoutes from './jugadores.routes.js';
import rostersRoutes from './rosters.routes.js';
import asignacionesRoutes from './asignaciones.routes.js';
import auxiliaresRoutes from './auxiliares.routes.js';

const router = Router();

// Primero las rutas con paths literales (/roles, /estados, /health).
router.use('/', auxiliaresRoutes);

// Rutas del módulo de jugadores.
router.use('/jugadores', jugadoresRoutes);

// Rutas del módulo de rosters. El router de asignaciones se monta dentro de
// él con mergeParams para heredar el :id del roster.
router.use('/rosters', rostersRoutes);
router.use('/rosters/:id/jugadores', asignacionesRoutes);

export default router;