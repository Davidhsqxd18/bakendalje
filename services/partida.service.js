const { db } = require('../config/firebase');
const usuarioService = require('./usuario.service');

class PartidaService {
  async crearPartida({ creadorId, colorPiezas }) {
    const partidasRef = db.collection('partidas');
    const doc = partidasRef.doc();
    const partidaId = doc.id;

    // Asignar color al creador
    let jugadorBlanco = null;
    let jugadorNegro = null;

    if (colorPiezas === 'blancas') {
      jugadorBlanco = creadorId;
    } else if (colorPiezas === 'negras') {
      jugadorNegro = creadorId;
    } else {
      // Aleatorio
      if (Math.random() > 0.5) {
        jugadorBlanco = creadorId;
      } else {
        jugadorNegro = creadorId;
      }
    }

    const nuevaPartida = {
      id: partidaId,
      jugadorBlanco,
      jugadorNegro,
      ganador: null,
      estado: 'espera', // 'espera' | 'jugando' | 'terminada' | 'empate'
      fechaInicio: new Date().toISOString(),
      fechaFin: null
    };

    await doc.set(nuevaPartida);
    return nuevaPartida;
  }

  async unirseAPartida({ partidaId, jugadorId }) {
    const partidaRef = db.collection('partidas').doc(partidaId);
    const doc = await partidaRef.get();

    if (!doc.exists) {
      throw new Error('La partida no existe.');
    }

    const partida = doc.data();
    if (partida.estado !== 'espera') {
      throw new Error('La partida ya no está en espera.');
    }

    // Verificar que el jugador que se une no sea el creador
    if (partida.jugadorBlanco === jugadorId || partida.jugadorNegro === jugadorId) {
      throw new Error('No puedes unirte a tu propia partida.');
    }

    const updates = {
      estado: 'jugando'
    };

    if (!partida.jugadorBlanco) {
      updates.jugadorBlanco = jugadorId;
    } else {
      updates.jugadorNegro = jugadorId;
    }

    await partidaRef.update(updates);
    return { ...partida, ...updates };
  }

  async obtenerPorId(partidaId) {
    const doc = await db.collection('partidas').doc(partidaId).get();
    if (!doc.exists) {
      throw new Error('Partida no encontrada.');
    }

    const partida = doc.data();

    // Cargar detalles de los jugadores para facilitar la visualización en frontend
    if (partida.jugadorBlanco) {
      try {
        const u = await usuarioService.obtenerPorId(partida.jugadorBlanco);
        partida.nombreBlanco = u.nombre;
        partida.eloBlanco = u.elo;
      } catch (e) {
        partida.nombreBlanco = 'Desconocido';
      }
    }
    if (partida.jugadorNegro) {
      try {
        const u = await usuarioService.obtenerPorId(partida.jugadorNegro);
        partida.nombreNegro = u.nombre;
        partida.eloNegro = u.elo;
      } catch (e) {
        partida.nombreNegro = 'Desconocido';
      }
    }

    return partida;
  }

  async listarPartidasActivas() {
    const snap = await db.collection('partidas').get();
    const partidas = snap.docs.map(doc => doc.data());
    
    // Filtrar en memoria por estado 'espera' o 'jugando'
    const activas = partidas.filter(p => p.estado === 'espera' || p.estado === 'jugando');

    // Cargar nombres para lobby
    const usuarios = await usuarioService.listar();
    const usuariosMap = new Map(usuarios.map(u => [u.id, u]));

    for (const p of activas) {
      if (p.jugadorBlanco) {
        const u = usuariosMap.get(p.jugadorBlanco);
        p.nombreBlanco = u ? u.nombre : 'Desconocido';
        p.eloBlanco = u ? u.elo : 1000;
      }
      if (p.jugadorNegro) {
        const u = usuariosMap.get(p.jugadorNegro);
        p.nombreNegro = u ? u.nombre : 'Desconocido';
        p.eloNegro = u ? u.elo : 1000;
      }
    }

    return activas;
  }

  async listarHistorialUsuario(usuarioId) {
    const snap = await db.collection('partidas').get();
    const partidas = snap.docs.map(doc => doc.data());

    // Filtrar partidas terminadas que involucren al usuario
    const historial = partidas.filter(p => 
      (p.estado === 'terminada' || p.estado === 'empate') &&
      (p.jugadorBlanco === usuarioId || p.jugadorNegro === usuarioId)
    );

    // Cargar detalles de oponentes y nombres
    const usuarios = await usuarioService.listar();
    const usuariosMap = new Map(usuarios.map(u => [u.id, u]));

    for (const p of historial) {
      if (p.jugadorBlanco) {
        const u = usuariosMap.get(p.jugadorBlanco);
        p.nombreBlanco = u ? u.nombre : 'Desconocido';
        p.eloBlanco = u ? u.elo : 1000;
      }
      if (p.jugadorNegro) {
        const u = usuariosMap.get(p.jugadorNegro);
        p.nombreNegro = u ? u.nombre : 'Desconocido';
        p.eloNegro = u ? u.elo : 1000;
      }
    }

    // Ordenar de más reciente a más antigua
    historial.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));

    return historial;
  }

  async finalizarPartida({ partidaId, estado, ganador }) {
    const partidaRef = db.collection('partidas').doc(partidaId);
    const doc = await partidaRef.get();

    if (!doc.exists) {
      throw new Error('Partida no encontrada.');
    }

    const partida = doc.data();
    if (partida.estado === 'terminada' || partida.estado === 'empate') {
      throw new Error('La partida ya ha finalizado.');
    }

    const updates = {
      estado, // 'terminada' | 'empate'
      ganador: ganador || null,
      fechaFin: new Date().toISOString()
    };

    await partidaRef.update(updates);

    // Actualizar ELOs
    if (estado === 'terminada' && ganador) {
      const perdedor = partida.jugadorBlanco === ganador ? partida.jugadorNegro : partida.jugadorBlanco;
      
      // Ganador: +20 pts
      const uGanador = await usuarioService.obtenerPorId(ganador);
      const nuevoEloGanador = (uGanador.elo || 1000) + 20;
      await usuarioService.actualizarElo(ganador, nuevoEloGanador, true);

      // Perdedor: -10 pts
      const uPerdedor = await usuarioService.obtenerPorId(perdedor);
      const nuevoEloPerdedor = Math.max(100, (uPerdedor.elo || 1000) - 10); // Límite inferior 100
      await usuarioService.actualizarElo(perdedor, nuevoEloPerdedor, false);
    } else if (estado === 'empate') {
      // Empate: +5 pts a cada uno
      if (partida.jugadorBlanco) {
        const uB = await usuarioService.obtenerPorId(partida.jugadorBlanco);
        await usuarioService.actualizarElo(partida.jugadorBlanco, (uB.elo || 1000) + 5, false);
      }
      if (partida.jugadorNegro) {
        const uN = await usuarioService.obtenerPorId(partida.jugadorNegro);
        await usuarioService.actualizarElo(partida.jugadorNegro, (uN.elo || 1000) + 5, false);
      }
    }

    return { ...partida, ...updates };
  }
}

module.exports = new PartidaService();
