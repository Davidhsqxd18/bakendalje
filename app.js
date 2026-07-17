const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();

const { isAllowedOrigin } = require('./config/cors-helper');

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      // En lugar de propagar un error que cause un 500 en Express,
      // pasamos false para que el navegador bloquee la petición como CORS
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Analizar cuerpo JSON
app.use(express.json());

// Importar rutas
const usuarioRoutes = require('./routes/usuario.routes');
const partidaRoutes = require('./routes/partida.routes');
const movimientoRoutes = require('./routes/movimiento.routes');
const rankingRoutes = require('./routes/ranking.routes');

// Registrar rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/partidas', partidaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/ranking', rankingRoutes);

// Ruta de estado de salud (health check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mensaje: 'Servidor ChessRank funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ mensaje: 'Ocurrió un error interno en el servidor' });
});

module.exports = app;
