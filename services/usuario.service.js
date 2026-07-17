const { db, auth } = require('../config/firebase');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

// Determinar el nivel de ranking basado en el ELO
const calcularNivel = (elo) => {
  if (elo >= 2400) return 'Gran Maestro';
  if (elo >= 2000) return 'Maestro';
  if (elo >= 1600) return 'Avanzado';
  if (elo >= 1200) return 'Intermedio';
  return 'Principiante';
};

class UsuarioService {
  async registrar({ nombre, correo, contraseña }) {
    try {
      // 1. Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contraseña);
      const userId = userCredential.user.uid;

      // 2. Crear documento de usuario en Firestore
      const usuariosRef = db.collection('usuarios');
      const userDoc = usuariosRef.doc(userId);

      const nuevoUsuario = {
        id: userId,
        nombre,
        correo,
        elo: 1000, // ELO inicial de 1000 puntos
        partidasJugadas: 0,
        partidasGanadas: 0,
        fechaRegistro: new Date().toISOString()
      };

      await userDoc.set(nuevoUsuario);

      // 3. Crear registro en colección de Ranking
      const rankingRef = db.collection('ranking').doc(userId);
      await rankingRef.set({
        id: userId,
        usuarioId: userId,
        puntos: 1000,
        posicion: 0, // Se recalculará dinámicamente
        nivel: calcularNivel(1000)
      });

      // Recalcular posiciones del ranking
      await this.recalcularPosicionesRanking();

      return nuevoUsuario;
    } catch (error) {
      // Mapear errores comunes de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El correo electrónico ya está registrado.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('El correo electrónico no es válido.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      throw error;
    }
  }

  async login({ correo, contraseña }) {
    try {
      // 1. Validar credenciales con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, correo, contraseña);
      const userId = userCredential.user.uid;

      // 2. Obtener datos del usuario desde Firestore
      const usuario = await this.obtenerPorId(userId);

      // 3. Generar token JWT para la sesión de Express
      const token = jwt.sign({ id: usuario.id, correo: usuario.correo }, JWT_SECRET, {
        expiresIn: '24h'
      });

      return { token, usuario };
    } catch (error) {
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-email'
      ) {
        throw new Error('Credenciales inválidas.');
      }
      throw error;
    }
  }

  async obtenerPorId(id) {
    const doc = await db.collection('usuarios').doc(id).get();
    if (!doc.exists) {
      throw new Error('Usuario no encontrado.');
    }
    const usuario = doc.data();
    const { contraseña, ...usuarioSinPass } = usuario;
    return usuarioSinPass;
  }

  async actualizar(id, { nombre, contraseña }) {
    const userRef = db.collection('usuarios').doc(id);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new Error('Usuario no encontrado.');
    }

    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (contraseña) {
      const salt = await bcrypt.genSalt(10);
      updates.contraseña = await bcrypt.hash(contraseña, salt);
    }

    await userRef.update(updates);
    
    // Devolver el usuario actualizado
    return await this.obtenerPorId(id);
  }

  async listar() {
    const snap = await db.collection('usuarios').get();
    return snap.docs.map(doc => {
      const { contraseña, ...usuarioSinPass } = doc.data();
      return usuarioSinPass;
    });
  }

  // Recalcula dinámicamente las posiciones en el ranking basándose en el ELO
  async recalcularPosicionesRanking() {
    const rankingRef = db.collection('ranking');
    const snap = await rankingRef.get();
    
    const rankings = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar de mayor a menor puntuación
    rankings.sort((a, b) => b.puntos - a.puntos);

    // Guardar los cambios con la posición actualizada
    for (let i = 0; i < rankings.length; i++) {
      const rank = rankings[i];
      const pos = i + 1;
      await rankingRef.doc(rank.id).update({
        posicion: pos,
        nivel: calcularNivel(rank.puntos)
      });
    }
  }

  // Actualiza el ELO de un usuario y recalcula el ranking
  async actualizarElo(userId, nuevoElo, ganoPartida = false) {
    const userRef = db.collection('usuarios').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const user = userDoc.data();
      const partidasJugadas = (user.partidasJugadas || 0) + 1;
      const partidasGanadas = ganoPartida ? (user.partidasGanadas || 0) + 1 : (user.partidasGanadas || 0);

      await userRef.update({
        elo: nuevoElo,
        partidasJugadas,
        partidasGanadas
      });

      // Actualizar en ranking
      const rankingRef = db.collection('ranking').doc(userId);
      await rankingRef.update({
        puntos: nuevoElo,
        nivel: calcularNivel(nuevoElo)
      });

      await this.recalcularPosicionesRanking();
    }
  }
}

module.exports = new UsuarioService();
