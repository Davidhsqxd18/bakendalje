const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const { allowedOrigins, isAllowedOrigin } = require('./config/cors-helper');

// Inicializar socket.io con CORS dinámico
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

console.log('Socket.IO CORS configured dynamically. Static allowed origins:', allowedOrigins);

// Registrar la instancia de io en la app desds express para que los controladores puedan acceder

app.set('io', io);


io.on('connection', (socket) => {
  console.log(`Cliente conectado a WebSockets: ${socket.id}`);

  // Unirse a una sala específica de partida
  socket.on('unirse_partida', (partidaId) => {
    socket.join(partidaId);
    console.log(`Cliente ${socket.id} se unió a la sala de partida: ${partidaId}`);
  });

  // Salir de una sala de partida
  socket.on('salir_partida', (partidaId) => {
    socket.leave(partidaId);
    console.log(`Cliente ${socket.id} abandonó la sala de partida: ${partidaId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado de WebSockets: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Servidor ChessRank (HTTP + WS) en:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`=========================================`);
});
