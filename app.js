const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de CORS para admitir el frontend local y dominios configurados en Vercel
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:4200', 'http://127.0.0.1:4200'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.CORS_ALLOW_ALL === 'true') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS origin no permitido: ${origin}`));
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
