const express = require('express');
const router = express.Router();
const partidaController = require('../controllers/partida.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, partidaController.crear);
router.get('/', authMiddleware, partidaController.listarActivas);
router.get('/historial/usuario', authMiddleware, partidaController.listarHistorial);
router.get('/:id', authMiddleware, partidaController.obtener);
router.post('/:id/unirse', authMiddleware, partidaController.unirse);
router.put('/:id/finalizar', authMiddleware, partidaController.finalizar);

module.exports = router;
