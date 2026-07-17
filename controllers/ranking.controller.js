const rankingService = require('../services/ranking.service');

class RankingController {
  async obtenerLeaderboard(req, res) {
    try {
      const leaderboard = await rankingService.obtenerLeaderboard();
      return res.status(200).json(leaderboard);
    } catch (error) {
      return res.status(500).json({ mensaje: error.message });
    }
  }

  async obtenerPorUsuario(req, res) {
    try {
      const usuarioId = req.params.usuarioId;
      const ranking = await rankingService.obtenerRankingUsuario(usuarioId);
      return res.status(200).json(ranking);
    } catch (error) {
      return res.status(404).json({ mensaje: error.message });
    }
  }
}

module.exports = new RankingController();
