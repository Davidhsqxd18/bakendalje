const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:4200', 'http://127.0.0.1:4200'];

/**
 * Valida si un origen de solicitud HTTP está permitido por la política CORS.
 * Permite de forma dinámica:
 *  - Orígenes locales (localhost, 127.0.0.1) con cualquier puerto.
 *  - Subdominios de netlify.app (útil para vistas previas y producción de Netlify).
 *  - Subdominios de vercel.app (útil para vistas previas y producción de Vercel).
 *  - Orígenes explícitos configurados en la variable de entorno CORS_ORIGINS.
 *  - Cualquier origen si CORS_ALLOW_ALL está establecido en 'true'.
 * 
 * @param {string} origin El origen de la petición (ej. 'https://example.netlify.app').
 * @returns {boolean} Verdadero si el origen está permitido, falso de lo contrario.
 */
const isAllowedOrigin = (origin) => {
  // Peticiones sin origen (por ejemplo, herramientas de backend locales, Postman, etc.) se permiten
  if (!origin) return true;
  
  if (process.env.CORS_ALLOW_ALL === 'true') return true;
  
  // Verificación de orígenes explícitos
  if (allowedOrigins.includes(origin)) return true;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Permitir subdominios de netlify
    if (hostname === 'netlify.app' || hostname.endsWith('.netlify.app')) {
      return true;
    }
    
    // Permitir subdominios de vercel
    if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) {
      return true;
    }
    
    // Permitir localhost e IP local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }
  } catch (err) {
    // Si no se puede parsear como URL válida, denegamos el acceso por defecto
  }

  return false;
};

module.exports = {
  allowedOrigins,
  isAllowedOrigin
};
