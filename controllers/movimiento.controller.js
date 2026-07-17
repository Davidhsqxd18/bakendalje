const movimientoService = require('../services/movimiento.service');

class MovimientoController {
  async registrar(req, res) {
    try {
      const { partidaId, turno, pieza, origen, destino } = req.body;
      if (!partidaId || turno === undefined || !pieza || !origen || !destino) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
      }

      const movimiento = await movimientoService.registrarMovimiento({
        partidaId,
        turno,
        pieza,
        origen,
        destino
      });

      // Emitir el movimiento en tiempo real a los jugadores en la sala
      const io = req.app.get('io');
      if (io) {
        io.to(partidaId).emit('nuevo_movimiento', movimiento);
      }

      return res.status(201).json(movimiento);
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }
  }

  async obtenerPorPartida(req, res) {
    try {
      const partidaId = req.params.partidaId;
      const movimientos = await movimientoService.obtenerMovimientosPartida(partidaId);
      return res.status(200).json(movimientos);
    } catch (error) {
      return res.status(500).json({ mensaje: error.message });
    }
  }
}

module.exports = new MovimientoController();
