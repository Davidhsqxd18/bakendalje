const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, rankingController.obtenerLeaderboard);
router.get('/:usuarioId', authMiddleware, rankingController.obtenerPorUsuario);

module.exports = router;
