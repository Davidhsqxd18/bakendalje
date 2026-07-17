const { db } = require('../config/firebase');
const usuarioService = require('./usuario.service');

class RankingService {
  async obtenerLeaderboard() {
    const rankingRef = db.collection('ranking');
    
    // Obtener todos los usuarios registrados
    const usuarios = await usuarioService.listar();
    
    // Obtener los rankings actuales de Firestore
    let snap = await rankingRef.get();
    const rankingsExistentes = new Set(snap.docs.map(doc => doc.id));
    
    // Auto-poblar o corregir el ranking para cualquier usuario que le falte
    let actualizoRankings = false;
    for (const u of usuarios) {
      if (!rankingsExistentes.has(u.id)) {
        const rRef = rankingRef.doc(u.id);
        const puntos = u.elo !== undefined ? u.elo : 1000;
        await rRef.set({
          id: u.id,
          usuarioId: u.id,
          puntos: puntos,
          posicion: 0,
          nivel: u.elo >= 2400 ? 'Gran Maestro' : (u.elo >= 2000 ? 'Maestro' : (u.elo >= 1600 ? 'Avanzado' : (u.elo >= 1200 ? 'Intermedio' : 'Principiante')))
        });
        actualizoRankings = true;
      }
    }
    
    if (actualizoRankings) {
      // Recalcular posiciones si agregamos nuevos rankings
      await usuarioService.recalcularPosicionesRanking();
    }
    
    // Obtener rankings ordenados por puntos de manera descendente
    snap = await rankingRef.orderBy('puntos', 'desc').get();
    
    const usuariosMap = new Map(usuarios.map(u => [u.id, u]));

    const leaderboard = [];
    for (const doc of snap.docs) {
      const rank = doc.data();
      const u = usuariosMap.get(rank.usuarioId);
      if (u) {
        rank.nombre = u.nombre;
        rank.partidasJugadas = u.partidasJugadas || 0;
        rank.partidasGanadas = u.partidasGanadas || 0;
        leaderboard.push(rank);
      }
    }

    // Asegurarse de ordenar y asignar posiciones correctas en memoria
    leaderboard.sort((a, b) => b.puntos - a.puntos);
    leaderboard.forEach((item, index) => {
      item.posicion = index + 1;
    });

    return leaderboard;
  }

  async obtenerRankingUsuario(usuarioId) {
    const doc = await db.collection('ranking').doc(usuarioId).get();
    if (!doc.exists) {
      // Si el ranking del usuario no existe, crearlo
      const u = await usuarioService.obtenerPorId(usuarioId);
      const points = u.elo !== undefined ? u.elo : 1000;
      await db.collection('ranking').doc(usuarioId).set({
        id: usuarioId,
        usuarioId: usuarioId,
        puntos: points,
        posicion: 0,
        nivel: u.elo >= 2400 ? 'Gran Maestro' : (u.elo >= 2000 ? 'Maestro' : (u.elo >= 1600 ? 'Avanzado' : (u.elo >= 1200 ? 'Intermedio' : 'Principiante')))
      });
      await usuarioService.recalcularPosicionesRanking();
      return this.obtenerRankingUsuario(usuarioId);
    }
    const rank = doc.data();
    
    // Obtener detalles del usuario
    const u = await usuarioService.obtenerPorId(usuarioId);
    rank.nombre = u.nombre;

    return rank;
  }
}

module.exports = new RankingService();
