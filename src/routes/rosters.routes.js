/**
 * Rutas de rosters.
 *
 * Montaje: /api/v1/rosters
 */

import { Router } from 'express';

import rostersController from '../controllers/rosters.controller.js';

const router = Router();

// RF-08
router.get('/', rostersController.listar);

// RF-09
router.get('/:id', rostersController.obtenerPorId);

// RF-07
router.post('/', rostersController.crear);

// RF-10
router.put('/:id', rostersController.actualizar);

// RF-11
router.delete('/:id', rostersController.eliminar);

export default router;