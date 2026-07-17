const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/registro', usuarioController.registro);
router.post('/login', usuarioController.login);
router.get('/perfil', authMiddleware, usuarioController.obtenerPerfil);
router.put('/perfil', authMiddleware, usuarioController.actualizarPerfil);
router.get('/', authMiddleware, usuarioController.listarUsuarios);

module.exports = router;
