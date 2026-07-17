const partidaService = require('../services/partida.service');

class PartidaController {
  async crear(req, res) {
    try {
      const creadorId = req.usuarioId;
      const { colorPiezas } = req.body;
      
      const partida = await partidaService.crearPartida({ creadorId, colorPiezas });
      return res.status(201).json(partida);
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async unirse(req, res) {
    try {
      const jugadorId = req.usuarioId;
      const partidaId = req.params.id;

      const partida = await partidaService.unirseAPartida({ partidaId, jugadorId });

      // Emitir evento de partida iniciada en tiempo real
      const io = req.app.get('io');
      if (io) {
        io.to(partidaId).emit('partida_iniciada', partida);
      }

      return res.status(200).json({ mensaje: 'Te has unido a la partida con éxito', partida });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async obtener(req, res) {
    try {
      const partidaId = req.params.id;
      const partida = await partidaService.obtenerPorId(partidaId);
      return res.status(200).json(partida);
    } catch (error) {
      return res.status(404).json({ mensaje: error.message });
    }
  }

  async listarActivas(req, res) {
    try {
      const partidas = await partidaService.listarPartidasActivas();
      return res.status(200).json(partidas);
    } catch (error) {
      return res.status(500).json({ mensaje: error.message });
    }
  }

  async listarHistorial(req, res) {
    try {
      const usuarioId = req.usuarioId;
      const historial = await partidaService.listarHistorialUsuario(usuarioId);
      return res.status(200).json(historial);
    } catch (error) {
      return res.status(500).json({ mensaje: error.message });
    }
  }

  async finalizar(req, res) {
    try {
      const partidaId = req.params.id;
      const { estado, ganador } = req.body; // ganador es el ID del jugador que ganó o 'empate'

      if (!estado || !['terminada', 'empate'].includes(estado)) {
        return res.status(400).json({ mensaje: 'Estado final de partida inválido' });
      }

      const partidaFinalizada = await partidaService.finalizarPartida({ partidaId, estado, ganador });

      // Emitir evento de partida finalizada en tiempo real
      const io = req.app.get('io');
      if (io) {
        io.to(partidaId).emit('partida_finalizada', partidaFinalizada);
      }

      return res.status(200).json({ mensaje: 'Partida finalizada con éxito', partida: partidaFinalizada });
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }
}

module.exports = new PartidaController();
