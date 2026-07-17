const jwt = require('jsonwebtoken');

// Clave secreta JWT (en producción debe venir de variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'chessrank-super-secret-key-12345';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ mensaje: 'No se proporcionó token de autorización' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ mensaje: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
