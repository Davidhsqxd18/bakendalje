/**
 * Prueba de calidad y verificación para el Backend de ChessRank.
 * Simula el registro de dos usuarios, creación de partida, movimientos y finalización de la partida con ELO.
 */
const path = require('path');
const fs = require('fs');

// Asegurar entorno de pruebas
process.env.JWT_SECRET = 'pruebas-de-calidad-secreto-123';

const usuarioService = require('./services/usuario.service');
const partidaService = require('./services/partida.service');
const movimientoService = require('./services/movimiento.service');
const rankingService = require('./services/ranking.service');

async function ejecutarPruebas() {
  console.log('==================================================');
  console.log(' INICIANDO PRUEBAS DE CALIDAD Y INTEGRACIÓN ');
  console.log('==================================================');

  // Limpiar/Reiniciar base de datos mock local para pruebas consistentes
  const dbPath = path.join(__dirname, 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      usuarios: {},
      ranking: {},
      partidas: {},
      movimientos: {}
    }, null, 2), 'utf8');
    console.log('√ Base de datos mock local reiniciada para las pruebas.');
  }

  try {
    // 1. Registro de Jugador 1
    console.log('\n[Paso 1] Registrando al Jugador 1 (Blanco)...');
    const jugador1 = await usuarioService.registrar({
      nombre: 'Magnus Carlsen',
      correo: 'magnus@chessrank.com',
      contraseña: 'password123'
    });
    console.log(`√ Jugador 1 registrado: ${jugador1.nombre} (ID: ${jugador1.id}, ELO: ${jugador1.elo})`);

    // 2. Registro de Jugador 2
    console.log('\n[Paso 2] Registrando al Jugador 2 (Negro)...');
    const jugador2 = await usuarioService.registrar({
      nombre: 'Hikaru Nakamura',
      correo: 'hikaru@chessrank.com',
      contraseña: 'password123'
    });
    console.log(`√ Jugador 2 registrado: ${jugador2.nombre} (ID: ${jugador2.id}, ELO: ${jugador2.elo})`);

    // 3. Crear una partida (como Magnus, eligiendo Blancas)
    console.log('\n[Paso 3] Magnus Carlsen crea una partida con piezas Blancas...');
    const partidaCreada = await partidaService.crearPartida({
      creadorId: jugador1.id,
      colorPiezas: 'blancas'
    });
    console.log(`√ Partida creada (ID: ${partidaCreada.id}, Estado: ${partidaCreada.estado}, Blanco: ${partidaCreada.jugadorBlanco})`);

    // 4. Unirse a la partida (como Hikaru)
    console.log('\n[Paso 4] Hikaru Nakamura se une a la partida...');
    const partidaIniciada = await partidaService.unirseAPartida({
      partidaId: partidaCreada.id,
      jugadorId: jugador2.id
    });
    console.log(`√ Partida iniciada (ID: ${partidaIniciada.id}, Estado: ${partidaIniciada.estado}, Negro: ${partidaIniciada.jugadorNegro})`);

    // 5. Registrar Movimientos (Simulando Jaque Mate del Pastor)
    // 1. e4 e5
    // 2. Qh5 Nc6
    // 3. Bc4 Nf6
    // 4. Qxf7#
    console.log('\n[Paso 5] Simulando jugadas de la partida (Mate del Pastor)...');
    
    const movimientosSimulados = [
      { turno: 1, pieza: 'P', origen: 'e2', destino: 'e4' }, // e4
      { turno: 2, pieza: 'P', origen: 'e7', destino: 'e5' }, // e5
      { turno: 3, pieza: 'Q', origen: 'd1', destino: 'h5' }, // Qh5
      { turno: 4, pieza: 'N', origen: 'b8', destino: 'c6' }, // Nc6
      { turno: 5, pieza: 'B', origen: 'f1', destino: 'c4' }, // Bc4
      { turno: 6, pieza: 'N', origen: 'g8', destino: 'f6' }, // Nf6
      { turno: 7, pieza: 'Q', origen: 'h5', destino: 'f7' }, // Qxf7# (Jaque Mate!)
    ];

    for (const mov of movimientosSimulados) {
      const movRegistrado = await movimientoService.registrarMovimiento({
        partidaId: partidaIniciada.id,
        turno: mov.turno,
        pieza: mov.pieza,
        origen: mov.origin || mov.origen,
        destino: mov.destino
      });
      console.log(`  - Movimiento registrado: Turno ${movRegistrado.turno} | Pieza ${movRegistrado.pieza} | ${movRegistrado.origen} -> ${movRegistrado.destino}`);
    }

    // 6. Finalizar partida y aplicar ELO
    console.log('\n[Paso 6] Finalizando la partida por Jaque Mate (Gana Magnus Carlsen)...');
    const partidaFinal = await partidaService.finalizarPartida({
      partidaId: partidaIniciada.id,
      estado: 'terminada',
      ganador: jugador1.id
    });
    console.log(`√ Partida finalizada con éxito. Ganador ID: ${partidaFinal.ganador}`);

    // 7. Verificar cambios de ELO y estadísticas
    console.log('\n[Paso 7] Verificando estadísticas de ELO actualizadas...');
    const perfilMagnus = await usuarioService.obtenerPorId(jugador1.id);
    const perfilHikaru = await usuarioService.obtenerPorId(jugador2.id);

    console.log(`  - Magnus Carlsen: ELO anterior: ${jugador1.elo} -> ELO actual: ${perfilMagnus.elo} (Partidas Ganadas: ${perfilMagnus.partidasGanadas}/${perfilMagnus.partidasJugadas})`);
    console.log(`  - Hikaru Nakamura: ELO anterior: ${jugador2.elo} -> ELO actual: ${perfilHikaru.elo} (Partidas Ganadas: ${perfilHikaru.partidasGanadas}/${perfilHikaru.partidasJugadas})`);

    // Validar sumas de ELO
    if (perfilMagnus.elo === 1020 && perfilHikaru.elo === 990) {
      console.log('√ Validación de cálculo de ELO correcta (+20 ganados, -10 perdidos).');
    } else {
      throw new Error(`Cálculo de ELO erróneo. Se esperaba 1020 y 990, pero se obtuvo ${perfilMagnus.elo} y ${perfilHikaru.elo}`);
    }

    // 8. Consultar la tabla de posiciones (Leaderboard)
    console.log('\n[Paso 8] Consultando la Tabla de Clasificaciones (Leaderboard)...');
    const tablaPosiciones = await rankingService.obtenerLeaderboard();
    console.log('--- Leaderboard Actualizado ---');
    tablaPosiciones.forEach(r => {
      console.log(`  #${r.posicion} - ${r.nombre}: ${r.puntos} pts (Nivel: ${r.nivel})`);
    });

    console.log('\n==================================================');
    console.log(' √√ PRUEBAS DE CALIDAD COMPLETADAS CON ÉXITO! √√ ');
    console.log('==================================================');

  } catch (error) {
    console.error('\n==================================================');
    console.error(` X ERROR EN LAS PRUEBAS DE CALIDAD: ${error.message} X`);
    console.error('==================================================');
    process.exit(1);
  }
}

ejecutarPruebas();
