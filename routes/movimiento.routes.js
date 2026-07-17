const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimiento.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, movimientoController.registrar);
router.get('/partida/:partidaId', authMiddleware, movimientoController.obtenerPorPartida);

module.exports = router;
