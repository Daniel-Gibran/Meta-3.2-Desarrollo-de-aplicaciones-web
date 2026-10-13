/**
 * Rutas de jugadores.
 *
 * Este archivo solo declara qué combinación de verbo y ruta existe, y a qué
 * controlador corresponde. No contiene lógica: toda la lógica de negocio
 * vive en los services.
 *
 * Montaje: /api/v1/jugadores
 */

import { Router } from 'express';

import jugadoresController from '../controllers/jugadores.controller.js';

const router = Router();

// RF-02, RF-06
router.get('/', jugadoresController.listar);

// RF-03
router.get('/:id', jugadoresController.obtenerPorId);

// RF-01
router.post('/', jugadoresController.crear);

// RF-04
router.put('/:id', jugadoresController.actualizar);

// RF-05
router.delete('/:id', jugadoresController.eliminar);

export default router;