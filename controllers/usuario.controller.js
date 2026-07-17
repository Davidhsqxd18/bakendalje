const usuarioService = require('../services/usuario.service');

class UsuarioController {
  async registro(req, res) {
    try {
      const { nombre, correo, contraseña } = req.body;
      if (!nombre || !correo || !contraseña) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
      }

      const usuario = await usuarioService.registrar({ nombre, correo, contraseña });
      return res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async login(req, res) {
    try {
      const { correo, contraseña } = req.body;
      if (!correo || !contraseña) {
        return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
      }

      const data = await usuarioService.login({ correo, contraseña });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async obtenerPerfil(req, res) {
    try {
      // El id proviene del middleware de autenticación
      const usuarioId = req.usuarioId;
      const usuario = await usuarioService.obtenerPorId(usuarioId);
      return res.status(200).json(usuario);
    } catch (error) {
      return res.status(404).json({ mensaje: error.message });
    }
  }

  async actualizarPerfil(req, res) {
    try {
      const usuarioId = req.usuarioId;
      const { nombre, contraseña } = req.body;
      
      const usuarioActualizado = await usuarioService.actualizar(usuarioId, { nombre, contraseña });
      return res.status(200).json({ mensaje: 'Perfil actualizado con éxito', usuario: usuarioActualizado });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async listarUsuarios(req, res) {
    try {
      const usuarios = await usuarioService.listar();
      return res.status(200).json(usuarios);
    } catch (error) {
      return res.status(500).json({ mensaje: error.message });
    }
  }
}

module.exports = new UsuarioController();
