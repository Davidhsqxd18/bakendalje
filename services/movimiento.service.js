const { db } = require('../config/firebase');

class MovimientoService {
  async registrarMovimiento({ partidaId, turno, pieza, origen, destino }) {
    const partidaRef = db.collection('partidas').doc(partidaId);
    const partidaDoc = await partidaRef.get();

    if (!partidaDoc.exists) {
      throw new Error('La partida no existe.');
    }

    const partida = partidaDoc.data();
    if (partida.estado !== 'jugando') {
      throw new Error('La partida no está activa.');
    }

    const movimientosRef = db.collection('movimientos');
    const doc = movimientosRef.doc();
    const movimientoId = doc.id;

    const nuevoMovimiento = {
      id: movimientoId,
      partidaId,
      turno: Number(turno),
      pieza,
      origen,
      destino,
      fecha: new Date().toISOString()
    };

    await doc.set(nuevoMovimiento);
    return nuevoMovimiento;
  }

  async obtenerMovimientosPartida(partidaId) {
    const snap = await db.collection('movimientos')
      .where('partidaId', '==', partidaId)
      .get();

    const movimientos = snap.docs.map(doc => doc.data());
    
    // Ordenar por número de turno ascendente
    movimientos.sort((a, b) => a.turno - b.turno);
    
    return movimientos;
  }
}

module.exports = new MovimientoService();
