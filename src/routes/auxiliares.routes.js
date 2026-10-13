/**
 * Rutas auxiliares: catálogos válidos y health check.
 *
 * Montaje: /api/v1
 */

import { Router } from 'express';

import auxiliaresController from '../controllers/auxiliares.controller.js';

const router = Router();

router.get('/roles', auxiliaresController.listarRoles);
router.get('/estados', auxiliaresController.listarEstados);
router.get('/tipos-roster', auxiliaresController.listarTiposRoster);
router.get('/health', auxiliaresController.health);

export default router;